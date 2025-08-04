import { defineDirective, InputParameter } from "@/modules/command";
import fetch from "node-fetch";
import { Gacha_Info, GachaUserInfo, GameType, Standard_Gacha, UIGF_v4 } from "#/mihoyo-gacha/util/types";
import { fakeIdFn, generateRedisKey } from "#/mihoyo-gacha/util/util";
import { DB_KEY_CURRENT_ID, DB_KEY_GACHA_DATA, ERROR_MESSAGES } from "#/mihoyo-gacha/util/constants";
import { GachaClientFactory } from "#/mihoyo-gacha/module/client-factory";
import { parseGameType } from "#/mihoyo-gacha/util/game-configs";
import { UIGFConverter } from "#/mihoyo-gacha/util/uigf-converter";
import { isPrivateMessage } from "@/modules/message";
import { FileRecepElem, ReplyRecepElem } from "@/modules/lib";

/**
 * 从UIGF v4.0 JSON文件导入抽卡记录
 */
async function importFromUIGF_v4_Json( fileUrl: string, gameType: GameType, {
	redis,
	sendMessage,
	messageData: { sender: { user_id } }
}: InputParameter ): Promise<void> {
	const response = await fetch( fileUrl );
	const rawData = await response.json();
	
	// 检测文件版本
	const version = UIGFConverter.detectVersion( rawData );
	let gachaDataMap: Map<GameType, Map<string, Gacha_Info[]>>;
	
	if ( version === "v4.0" ) {
		// 验证UIGF v4.0格式
		const validation = UIGFConverter.validateUIGF_v4( rawData );
		if ( !validation.valid ) {
			await sendMessage( `UIGF v4.0格式验证失败：\n${ validation.errors[0] }` );
			return;
		}
		
		// 转换UIGF v4.0数据
		gachaDataMap = UIGFConverter.convertFromUIGF_v4( rawData as UIGF_v4 );
	} else {
		// 处理旧版本格式（向下兼容）
		const legacyData = rawData as Standard_Gacha;
		gachaDataMap = new Map();
		const uidDataMap = new Map<string, Gacha_Info[]>();
		
		if ( legacyData.list ) {
			const gachaList: Gacha_Info[] = legacyData.list.map( data => ( {
				uid: legacyData.info.uid,
				gacha_id: data.gacha_id || "",
				gacha_type: data.gacha_type,
				item_id: data.item_id,
				count: data.count,
				time: data.time,
				name: data.name,
				lang: legacyData.info.lang,
				item_type: data.item_type,
				rank_type: data.rank_type,
				id: data.id
			} ) );
			uidDataMap.set( legacyData.info.uid, gachaList );
			gachaDataMap.set( gameType, uidDataMap );
		}
	}
	
	// 获取游戏配置
	const client = GachaClientFactory.createClient( gameType );
	const gameConfig = client.getGameConfig();
	
	// 检查是否有当前游戏的数据
	const currentGameData = gachaDataMap.get( gameType );
	if ( !currentGameData || currentGameData.size === 0 ) {
		await sendMessage( `文件中未找到${ gameConfig.name }的抽卡记录数据。` );
		return;
	}
	
	let totalImported = 0;
	let importedUids: string[] = [];
	
	// 导入数据
	for ( const [ uid, gachaList ] of currentGameData ) {
		if ( gachaList.length === 0 ) continue;
		
		const func = fakeIdFn();
		for ( const gachaData of gachaList ) {
			const gachaId: string = gachaData.id || func();
			const gachaInfo: Gacha_Info = {
				...gachaData,
				id: gachaId,
				uid: uid
			};
			
			// 对绝区零的键特殊处理
			const dbKey = generateRedisKey( DB_KEY_GACHA_DATA, {
				gacha_type: gameType === GameType.ZZZ ? UIGFConverter.mapZzzGachaType( gachaData.gacha_type ) : gachaData.gacha_type,
				uid: uid,
				prefix: gameConfig.redisPrefix
			} );
			
			await redis.setHash( dbKey, { [gachaId]: JSON.stringify( gachaInfo ) } );
			totalImported++;
		}
		
		// 设置用户信息
		const currentUidDbKey = generateRedisKey( DB_KEY_CURRENT_ID, {
			qq: user_id,
			prefix: gameConfig.redisPrefix
		} );
		
		const existingUid: string = await redis.getHashField( currentUidDbKey, "uid" );
		if ( !existingUid ) {
			const data: GachaUserInfo = {
				uid,
				region_time_zone: 8,
				region: gameConfig.region[uid[0]] || gameConfig.region["cn"]
			};
			await redis.setHash( currentUidDbKey, { ...data } );
		}
		
		importedUids.push( uid );
	}
	
	await sendMessage(
		`${ gameConfig.name } 抽卡记录导入完成！\n` +
		`导入UID: ${ importedUids.join( ', ' ) }\n` +
		`导入记录数: ${ totalImported } 条\n` +
		`文件格式: ${ version }`
	);
}

/**
 * 从Excel文件导入抽卡记录
 */
async function importFromExcel( fileUrl: string, gameType: GameType, {
	redis,
	sendMessage,
	messageData: { sender: { user_id } }
}: InputParameter ): Promise<void> {
	const response = await fetch( fileUrl );
	const buffer = await response.arrayBuffer();
	const ExcelJS = require( 'exceljs' );
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load( buffer );
	
	// 获取游戏配置
	const client = GachaClientFactory.createClient( gameType );
	const gameConfig = client.getGameConfig();
	
	let importCount = 0;
	let uid = '';
	const func = fakeIdFn();
	
	// 查找原始数据工作表
	const originSheet = workbook.getWorksheet( "原始数据" );
	if ( originSheet ) {
		const headers = originSheet.getRow( 1 ).values as string[];
		const uidIndex = headers.indexOf( 'uid' );
		const langIndex = headers.indexOf( 'lang' );
		
		originSheet.eachRow( { includeEmpty: false }, ( row: string[], rowNumber: number ) => {
			if ( rowNumber === 1 ) return; // 跳过标题行
			
			const rowData = row.values;
			if ( uidIndex > 0 ) uid = rowData[uidIndex];
			const lang = langIndex > 0 ? rowData[langIndex] : 'zh-cn';
			
			// 构建抽卡记录数据
			const gachaData: any = {};
			headers.forEach( ( header, index ) => {
				if ( index > 0 && rowData[index] !== undefined ) {
					gachaData[header] = rowData[index];
				}
			} );
			
			if ( gachaData.gacha_type && gachaData.time ) {
				const gachaId = gachaData.id || func();
				const gachaInfo: Gacha_Info = {
					...gachaData,
					id: gachaId,
					lang,
					uid
				};
				
				const dbKey = generateRedisKey( DB_KEY_GACHA_DATA, {
					gacha_type: gameType === GameType.ZZZ ? UIGFConverter.mapZzzGachaType( gachaData.gacha_type ) : gachaData.gacha_type,
					uid,
					prefix: gameConfig.redisPrefix
				} );
				
				redis.setHash( dbKey, { [gachaId]: JSON.stringify( gachaInfo ) } );
				importCount++;
			}
		} );
		
		// 设置用户信息
		if ( uid ) {
			const currentUidDbKey = generateRedisKey( DB_KEY_CURRENT_ID, {
				qq: user_id,
				prefix: gameConfig.redisPrefix
			} );
			
			const existingUid: string = await redis.getHashField( currentUidDbKey, "uid" );
			if ( !existingUid ) {
				const data: GachaUserInfo = {
					uid,
					region_time_zone: 8,
					region: gameConfig.region[uid[0]]
				};
				await redis.setHash( currentUidDbKey, { ...data } );
			}
		}
		
		await sendMessage( `${ gameConfig.name } ${ uid } 的 ${ importCount } 条抽卡记录数据已从Excel导入。` );
	} else {
		await sendMessage( `${ gameConfig.name }Excel文件格式不正确，未找到"原始数据"工作表。` );
	}
}

async function getFileUrl( input: InputParameter ): Promise<string> {
	const { messageData, client, logger } = input;
	const replyMessage = messageData.message.find( value => value.type === "reply" ) as ReplyRecepElem;
	const messageId = replyMessage.data.id;
	const { status, wording, data } = await client.getMessage( Number.parseInt( messageId ) );
	if ( status != 'ok' ) {
		logger.error( `[导入抽卡记录] 获取文件链接失败: `, wording );
		throw ERROR_MESSAGES.NOT_FOUND_FILE;
	}
	const fileMessage = data.message.find( item => item.type === 'file' ) as FileRecepElem;
	const fileId = fileMessage?.data?.file_id;
	if ( !fileId ) {
		logger.error( `[导入抽卡记录] 获取文件链接失败: `, data );
		throw ERROR_MESSAGES.NOT_FOUND_FILE;
	}
	
	const response = isPrivateMessage( messageData ) ?
		await client.getPrivateFileUrl( messageData.user_id, fileId ) :
		await client.getGroupFileUrl( messageData.group_id, fileId );
	if ( response.status !== 'ok' ) {
		throw new Error( response.wording );
	}
	const url = response.data?.url;
	if ( !url ) {
		logger.error( `[导入抽卡记录] 获取文件链接失败: `, response.data );
		throw ERROR_MESSAGES.NOT_FOUND_FILE;
	}
	return url;
}

export default defineDirective( "order", async ( input ) => {
	const { sendMessage, logger, matchResult } = input;
	
	const gameTypeStr = matchResult.match[0];
	const importType = matchResult.match[1];
	let fileUrl = matchResult.match[2];
	const gameType = parseGameType( gameTypeStr );
	
	// 获取游戏配置
	const client = GachaClientFactory.createClient( gameType );
	const gameConfig = client.getGameConfig();
	
	// 检查是否提供了文件URL
	if ( !fileUrl ) {
		fileUrl = await getFileUrl( input );
	}
	
	try {
		if ( importType === 'json' ) {
			logger.info( `[${ gameConfig.name }抽卡导入] 开始从JSON文件导入: ${ fileUrl }` );
			await importFromUIGF_v4_Json( fileUrl, gameType, input );
		} else if ( importType === 'excel' ) {
			logger.info( `[${ gameConfig.name }抽卡导入] 开始从Excel文件导入: ${ fileUrl }` );
			await importFromExcel( fileUrl, gameType, input );
		} else {
			await sendMessage( `${ gameConfig.name }不支持的文件格式，请提供JSON或Excel文件。` );
		}
	} catch ( error ) {
		logger.error( `[${ gameConfig.name }抽卡导入] 导入失败:`, error );
		await sendMessage( `${ gameConfig.name }抽卡记录导入失败: ${ ( error as Error ).message || error }` );
	}
} );
