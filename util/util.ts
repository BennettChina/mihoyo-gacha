import { Md5 } from "md5-typescript";
import { FakeIdFunc, Gacha_Info, OSSConfig, Standard_Gacha_Data } from "#/mihoyo-gacha/util/types";
import { exec } from "child_process";
import FileManagement from "@/modules/file";
import bot from "ROOT";
import { createReadStream } from "fs";
import { getRandomString } from "@/utils/random";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import moment from "moment";

export async function sleep( ms: number ): Promise<void> {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}

function parseID( msg: string ): number {
	if ( !msg ) {
		return 1;
	}
	const id: number = parseInt( msg );
	if ( !Number.isNaN( id ) ) {
		return id;
	}
	
	const res: string[] | null = msg.match( /(\d+)/g );
	if ( res ) {
		const list: string[] = res.sort( ( x, y ) => x.length - y.length );
		return parseInt( list[0] );
	} else {
		return 1;
	}
}

export function generateDS(): string {
	// K2
	const n: string = "rtvTthKxEyreVXQCnhluFgLXPOFKPHlA";
	const i: number = Date.now() / 1000 | 0;
	const r: string = getRandomString( 6 ).toLowerCase();
	const c: string = Md5.init( `salt=${ n }&t=${ i }&r=${ r }` );
	
	return `${ i },${ r },${ c }`;
}

export function obj2ParamsStr( obj: object ): string {
	const params: string[] = [];
	for ( let key in obj ) {
		params.push( `${ key }=${ obj[key] }` );
	}
	return params.join( '&' );
}

export function cookie2Obj( cookie: string ): any {
	return decodeURIComponent( cookie ).split( ";" )
		.filter( item => !!item && item.trim().length > 0 )
		.map( item => item.split( '=' ) )
		.reduce( ( acc, [ k, v ] ) => ( acc[k.trim().replace( '"', '' )] = v ) && acc, {} );
}

export const fakeIdFn: () => FakeIdFunc = () => {
	let id = 1000000000000000000n;
	return () => {
		id = id + 1n
		return id.toString( 10 );
	}
}

const header_zh_cn = {
	time: '时间',
	name: '名称',
	item_type: '类别',
	rank_type: '星级',
	gacha_type: '祈愿类型'
}

// 注意：游戏特定的抽卡类型已移至 util/game-configs.ts 中的游戏配置
// 这里保留 ZZZ 的定义用于向后兼容
export const gacha_types_zh_cn = {
	"2001": "独家频段",
	"3001": "音擎频段",
	"1001": "常驻频段",
	"5001": "邦布频段"
};

const gacha_types_en_us = {
	"2001": "Character Event Warp",
	"3001": "Light Cone Event Warp",
	"1001": "Stellar Warp",
	"5001": "Departure Warp"
};

export function convert2Lang( key: string, lang: string ): string {
	return lang === 'zh-cn' ? header_zh_cn[key] : key;
}

export function convert2Readable( gacha_type: string, lang: string ): string {
	return lang === 'zh-cn' ? gacha_types_zh_cn[gacha_type] : gacha_types_en_us[gacha_type];
}

/**
 * 根据游戏配置获取抽卡类型映射
 * @param gameConfig 游戏配置
 * @param lang 语言（暂时只支持中文）
 */
export function getGachaTypes( gameConfig: any, lang: string = 'zh-cn' ): Record<string, string> {
	// 目前只支持中文，后续可扩展多语言
	return gameConfig.gachaTypes;
}

/**
 * 根据游戏配置将抽卡类型转换为可读文本
 * @param gachaType 抽卡类型
 * @param gameConfig 游戏配置
 * @param lang 语言
 */
export function convertGachaTypeToReadable( gachaType: string, gameConfig: any, lang: string = 'zh-cn' ): string {
	const gachaTypes = getGachaTypes( gameConfig, lang );
	return gachaTypes[gachaType] || gachaType;
}

const rank_color = {
	"3": "ff8e8e8e",
	"4": "ffa256e1",
	"5": "ffbd6932",
}

export function getColor( rank_type: string ): string {
	return rank_color[rank_type];
}

export async function uploadOSS( file_path: string, file_name: string, qiniu_config: OSSConfig ): Promise<string> {
	// Create an Amazon S3 service client object.
	const s3Client = new S3Client( {
		region: qiniu_config.region, endpoint: `https://${ qiniu_config.endpoint }`,
		credentials: {
			accessKeyId: qiniu_config.accessKey,
			secretAccessKey: qiniu_config.secretKey
		}
	} );
	
	// Set the parameters
	const params = {
		Bucket: qiniu_config.bucket,
		Key: `${ qiniu_config.folder }/${ file_name }`,
		Body: createReadStream( file_path )
	};
	
	// Create an object and upload it to the Amazon S3 bucket.
	return new Promise( ( resolve, reject ) => {
		s3Client.send( new PutObjectCommand( params ) ).then( ( _resp ) => {
			resolve( `${ qiniu_config.domain }/${ params.Key }?attname=${ file_name }` );
		} ).catch( ( reason: any ) => {
			reject( reason );
		} );
	} )
}

/* 命令执行 */
export async function execHandle( command: string ): Promise<string> {
	return new Promise( ( resolve, reject ) => {
		exec( command, ( error, stdout, stderr ) => {
			if ( error ) {
				reject( error );
			} else {
				resolve( stdout );
			}
		} )
	} )
}

/**
 *  检查依赖是否安装。
 * @param file {FileManagement} 文件管理器
 * @param dependencies {string[]} 依赖列表
 */
export function checkDependencies( file: FileManagement, ...dependencies: string[] ): string[] {
	const path: string = file.getFilePath( "package.json", "root" );
	const { dependencies: dep } = require( path );
	// 过滤出未安装的依赖
	const keys: string[] = Object.keys( dep );
	return dependencies.filter( dependency => !keys.includes( dependency ) );
}

/**
 * 获取Redis中key的剩余过期时间。
 * @param key {string} Redis key
 */
export async function getTimeOut( key: string ): Promise<number> {
	return await bot.redis.client.ttl( key );
}

/**
 * 将秒数转换为时分秒字符串。
 * @param ttl {number} 秒数
 * @return {string} 时分秒字符串，如 "1 时 2 分 3 秒"
 */
export function secondToString( ttl: number ): string {
	const hour = Math.floor( ttl / 3600 );
	const minute = Math.floor( ( ttl - hour * 3600 ) / 60 );
	const second = ttl % 60;
	return `${ hour } 时 ${ minute } 分 ${ second } 秒`;
}


/**
 * 按照升序排列，优先比较时间，时间相同则比较ID。
 * @param prev
 * @param curr
 * @return 0,1,-1
 */
export function sortRecords( prev: Gacha_Info | Standard_Gacha_Data, curr: Gacha_Info | Standard_Gacha_Data ): number {
	const diff = moment( prev.time ).diff( moment( curr.time ) );
	if ( diff > 0 ) {
		return 1;
	} else if ( diff === 0 ) {
		return prev.id!.localeCompare( curr.id! );
	} else {
		return -1;
	}
}

export function htmlDecode( str: string ): string {
	str = str.replace( /&#(\d+);/gi, function ( match, numStr ) {
		const num = parseInt( numStr, 10 );
		return String.fromCharCode( num );
	} );
	const codes = { 'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"' };
	const translate_re = /&(lt|gt|nbsp|amp|quot);/ig;
	return str.replace( translate_re, ( _all, t ) => codes[t] );
}

/**
 * 生成 Redis 键名
 * @param template 键名模板
 * @param replacements 替换参数
 */
export function generateRedisKey( template: string, replacements: Record<string, string | number> ): string {
	let key = template;
	
	// 替换占位符
	for ( const [ placeholder, value ] of Object.entries( replacements ) ) {
		key = key.replace( `$${ placeholder }`, String( value ) );
	}
	return key;
}

/**
 * 安全的 URL 解析
 * @param urlString URL 字符串
 */
export function safeParseURL( urlString: string ): { success: true; url: URL } | { success: false; error: string } {
	try {
		const url = new URL( htmlDecode( urlString ) );
		return { success: true, url };
	} catch ( error ) {
		return {
			success: false,
			error: `无效的URL格式: ${ error instanceof Error ? error.message : String( error ) }`
		};
	}
}

/**
 * 验证 URL 是否包含必要的参数
 * @param url URL 对象
 * @param requiredParams 必需的参数列表
 */
export function validateURLParams( url: URL, requiredParams: string[] ): { success: true } | {
	success: false;
	missing: string[]
} {
	const missing = requiredParams.filter( param => !url.searchParams.has( param ) );
	if ( missing.length > 0 ) {
		return { success: false, missing };
	}
	return { success: true };
}

/**
 * 检查字符串是否为有效的URL
 * @param str 待检查的字符串
 */
export function isValidURL( str: string ): boolean {
	return str.startsWith( "https://" ) || str.startsWith( "http://" );
}

/**
 * 获取数字或默认值
 * @param input 待检查的数字
 * @param defaultNum 默认值
 */
export function getValueOrDefault( input: number, defaultNum: number ): number {
	return Number.isFinite( input ) ? input : defaultNum;
}