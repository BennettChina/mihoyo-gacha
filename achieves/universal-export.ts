import { defineDirective, InputParameter } from "@/modules/command";
import { Gacha_Info, GameConfig, GameType, UIGF_v4 } from "#/mihoyo-gacha/util/types";
import { GachaClientFactory } from "#/mihoyo-gacha/module/client-factory";
import { generateRedisKey, getTimeOut, secondToString, sortRecords, uploadOSS } from "#/mihoyo-gacha/util/util";
import { DB_KEY_CURRENT_ID, DB_KEY_GACHA_DATA, DB_KEY_GACHA_HTML_URL } from "#/mihoyo-gacha/util/constants";
import { UIGFConverter } from "#/mihoyo-gacha/util/uigf-converter";
import moment from "moment";
import fs from "fs";
import { resolve } from "path";
import { gacha_config } from "#/mihoyo-gacha/init";
import FileManagement from "@/modules/file";
import { segment } from "@/modules/lib";
import { parseGameType } from "#/mihoyo-gacha/util/game-configs";

/**
 * 发送导出结果
 */
async function sendExportResult( url: string, gameName: string, { logger, sendMessage }: InputParameter ) {
	if ( gacha_config.qrcode ) {
		const { toDataURL } = require( "qrcode" );
		const options = {
			errorCorrectionLevel: 'H',
			margin: 1,
			color: {
				dark: '#000',
				light: '#FFF',
			}
		};
		toDataURL( url, options, ( err: any, image: string ) => {
			if ( err || !image ) {
				logger.error( `${ gameName }二维码生成失败`, err );
				sendMessage( `${ gameName }抽卡记录文件已导出，可在浏览器访问 ${ url } 下载查看。` );
				return;
			}
			image = image.replace( "data:image/png;base64,", "" );
			const qr_code = segment.image( `base64://${ image }` );
			sendMessage( qr_code );
		} );
	} else {
		await sendMessage( `${ gameName }抽卡记录文件已导出，可在浏览器访问 ${ url } 下载查看。` );
	}
}

/**
 * 导出为UIGF v4.0 JSON格式
 */
async function exportToUIGF_v4_JSON( exportData: UIGF_v4, gameConfig: GameConfig, i: InputParameter ) {
	const { file, sendMessage, logger } = i;
	const json = JSON.stringify( exportData, null, 2 );
	
	// 生成文件名：UIGF-{游戏类型}-{UID}-{时间戳}.json
	let uid = "";
	if ( exportData.hk4e && exportData.hk4e.length > 0 ) {
		uid = exportData.hk4e[0].uid.toString();
	} else if ( exportData.hkrpg && exportData.hkrpg.length > 0 ) {
		uid = exportData.hkrpg[0].uid.toString();
	} else if ( exportData.nap && exportData.nap.length > 0 ) {
		uid = exportData.nap[0].uid.toString();
	}
	
	const timestamp = typeof exportData.info.export_timestamp === 'number'
		? exportData.info.export_timestamp
		: parseInt( exportData.info.export_timestamp.toString() );
	const fileName = `UIGF-v4.0-${ uid }-${ moment( timestamp * 1000 ).format( "yyyyMMDD-HHmmss" ) }.json`;
	const tmpPath = resolve( file.root, 'tmp' );
	
	if ( !fs.existsSync( tmpPath ) ) {
		fs.mkdirSync( tmpPath );
	}
	
	const exportJsonPath = resolve( tmpPath, fileName );
	const opened: number = fs.openSync( exportJsonPath, "w" );
	fs.writeSync( opened, json );
	fs.closeSync( opened );
	
	if ( gacha_config.s3.enable ) {
		try {
			// 上传到 OSS
			const url: string = await uploadOSS( exportJsonPath, fileName, gacha_config.s3 );
			// 导出后删掉临时文件
			fs.unlinkSync( exportJsonPath );
			await sendExportResult( url, gameConfig.name, i );
			return;
		} catch ( error ) {
			logger.error( `${ gameConfig.name }抽卡记录导出成功，上传 OSS 失败！`, error );
			await sendMessage( `${ gameConfig.name }文件导出成功，上传云存储失败，请联系 BOT 持有者反馈该问题。` );
			// 删掉避免占用空间，有需求重新生成。
			fs.unlinkSync( exportJsonPath );
		}
	}
}

/**
 * 导出抽卡记录URL
 */
async function exportGachaUrl( userId: number, sn: string, gameType: GameType, i: InputParameter ) {
	const { redis, sendMessage, logger } = i;
	const client = GachaClientFactory.createClient( gameType );
	const gameConfig = client.getGameConfig();
	
	try {
		await client.getURL( sn, userId );
	} catch ( error ) {
		logger.error( `[${ gameConfig.name }抽卡分析] 链接生成失败:`, error );
		await sendMessage( `${ gameConfig.name }链接生成失败: ${ error }` );
		return;
	}
	
	const htmlKey = generateRedisKey( DB_KEY_GACHA_HTML_URL, {
		qq: userId,
		sn: sn || "1",
		prefix: gameConfig.redisPrefix
	} );
	
	const url: string = await redis.getString( htmlKey );
	if ( url ) {
		await sendMessage( url );
		const timeout: number = await getTimeOut( htmlKey );
		const humanTime: string = secondToString( timeout );
		await sendMessage( `链接将在${ humanTime }后过期。` );
		return;
	}
}

/**
 * 获取版本号
 */
function getVersion( file: FileManagement ): string {
	const path: string = file.getFilePath( "package.json", "root" );
	const { version } = require( path );
	return version.split( "-" )[0];
}

export default defineDirective( "order", async ( input ) => {
	const { sendMessage, messageData, redis, matchResult } = input;
	const gameTypeStr = matchResult.match[0];
	let exportType = "json";
	if ( matchResult.match.length > 1 ) {
		exportType = matchResult.match[1];
	}
	let serviceId = "1";
	if ( matchResult.match.length > 2 ) {
		serviceId = matchResult.match[2];
	}
	const gameType = parseGameType( gameTypeStr );
	const { sender: { user_id } } = messageData;
	
	// 获取游戏配置
	const client = GachaClientFactory.createClient( gameType );
	const gameConfig = client.getGameConfig();
	
	// 链接直接导出
	if ( exportType === 'url' ) {
		await exportGachaUrl( user_id, serviceId, gameType, input );
		return;
	}
	
	if ( !gacha_config.s3.enable ) {
		input.logger.warn( `[${ gameConfig.name }抽卡分析插件] 无法导出，未开启OSS功能，无法发送文件给用户！` );
		await sendMessage( `${ gameConfig.name }无法导出，暂不支持直接发送文件，需要联系 BOT 持有人开启 OSS 功能` );
		return;
	}
	
	// 获取存储的抽卡记录数据
	const currentUidDbKey = generateRedisKey( DB_KEY_CURRENT_ID, {
		qq: user_id,
		prefix: gameConfig.redisPrefix
	} );
	
	const { uid } = await redis.getHash( currentUidDbKey );
	if ( !uid ) {
		await sendMessage( `${ gameConfig.name }未找到绑定的UID，请先绑定账号。` );
		return;
	}
	
	// 收集当前游戏的抽卡数据
	const gachaDataList: Gacha_Info[] = [];
	let lang: string = "zh-cn";
	
	// 遍历所有抽卡类型获取数据
	const gachaTypes = Object.keys( gameConfig.gachaTypes );
	for ( const gachaType of gachaTypes ) {
		const dbKey = generateRedisKey( DB_KEY_GACHA_DATA, {
			gacha_type: gachaType,
			uid,
			prefix: gameConfig.redisPrefix
		} );
		
		const gachaDataMap: Record<string, string> = await redis.getHash( dbKey );
		for ( const id in gachaDataMap ) {
			const gachaData: Gacha_Info = JSON.parse( gachaDataMap[id] );
			lang = gachaData.lang;
			gachaDataList.push( gachaData );
		}
	}
	
	if ( gachaDataList.length === 0 ) {
		await sendMessage( `${ gameConfig.name }当前账号${ uid }无历史抽卡数据.` );
		return;
	}
	
	// 构建游戏数据映射
	const gachaDataMap = new Map<GameType, Map<string, Gacha_Info[]>>();
	const uidDataMap = new Map<string, Gacha_Info[]>();
	uidDataMap.set( uid, gachaDataList.sort( ( prev, curr ) => sortRecords( prev, curr ) ) );
	gachaDataMap.set( gameType, uidDataMap );
	
	// 转换为UIGF v4.0格式
	const exportData: UIGF_v4 = UIGFConverter.convertToUIGF_v4(
		gachaDataMap,
		'Adachi-BOT',
		`v${ getVersion( input.file ) }`
	);
	
	await exportToUIGF_v4_JSON( exportData, gameConfig, input );
} );
