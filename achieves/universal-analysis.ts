import { defineDirective } from "@/modules/command";
import { GameType } from "#/mihoyo-gacha/util/types";
import {
	DB_EXPIRE_24H,
	DB_KEY_GACHA_HTML_URL,
	DB_KEY_GACHA_URL,
	DB_KEY_GACHA_URL_DEFAULT,
	ERROR_MESSAGES
} from "#/mihoyo-gacha/util/constants";
import { generateRedisKey, isValidURL, safeParseURL, validateURLParams } from "#/mihoyo-gacha/util/util";
import { GachaClientFactory } from "#/mihoyo-gacha/module/client-factory";
import { parseGameType } from "#/mihoyo-gacha/util/game-configs";
import Database from "@/modules/database";
import { Logger } from "log4js";


/**
 * 处理URL类型的输入
 * 解析用户提供的抽卡记录URL，验证其有效性并存储到Redis缓存
 *
 * @param rawMessage 包含抽卡记录URL的原始消息
 * @param userId 用户QQ号
 * @param gameType 游戏类型
 * @param redis Redis数据库实例
 * @param logger 日志记录器实例
 * @returns Promise<处理结果> 成功时返回API URL，失败时返回错误信息
 */
async function handleURLInput(
	rawMessage: string,
	userId: number,
	gameType: GameType,
	redis: Database,
	logger: Logger
): Promise<{ success: true; url: string } | { success: false; error: string }> {
	const parseResult = safeParseURL( rawMessage );
	if ( !parseResult.success ) {
		return { success: false, error: parseResult.error };
	}
	
	const { url } = parseResult;
	const validationResult = validateURLParams( url, [ "authkey" ] );
	if ( !validationResult.success ) {
		return { success: false, error: ERROR_MESSAGES.MISSING_AUTHKEY };
	}
	
	// 获取游戏客户端以确定正确的API URL
	const client = GachaClientFactory.createClient( gameType );
	const gameConfig = client.getGameConfig();
	
	// 构建API URL（假设使用国服，实际应该根据URL判断）
	const apiUrl = `${ gameConfig.apiUrls.cn.gacha }${ url.search }`;
	const defaultDbKey = generateRedisKey( DB_KEY_GACHA_URL_DEFAULT, {
		qq: userId,
		prefix: gameConfig.redisPrefix
	} );
	
	try {
		await redis.setString( defaultDbKey, apiUrl, DB_EXPIRE_24H );
		return { success: true, url: apiUrl };
	} catch ( error ) {
		logger.error( `[${ gameConfig.name }抽卡分析] Redis存储失败`, error );
		return { success: false, error: `存储失败: ${ error }` };
	}
}

/**
 * 处理Cookie类型的输入
 * 使用用户已绑定的Cookie信息生成抽卡记录API URL
 *
 * @param sn 服务序号，用于标识不同的游戏账号
 * @param userId 用户QQ号
 * @param gameType 游戏类型
 * @returns Promise<处理结果> 成功时返回API URL，失败时返回错误信息
 */
async function handleCookieInput(
	sn: string,
	userId: number,
	gameType: GameType
): Promise<{ success: true; url: string } | { success: false; error: string }> {
	try {
		const client = GachaClientFactory.createClient( gameType );
		const url = await client.getURL( sn, userId );
		return { success: true, url };
	} catch ( error ) {
		return { success: false, error: `${ ERROR_MESSAGES.URL_GENERATION_FAILED }: ${ error }` };
	}
}

/**
 * 清理失败的缓存数据
 * 当数据加载失败时，清理相关的Redis缓存以避免使用无效数据
 *
 * @param userId 用户QQ号
 * @param sn 服务序号
 * @param gameType 游戏类型
 * @param redis Redis数据库实例
 * @returns Promise<void>
 */
async function cleanupFailedCache( userId: number, sn: string, gameType: GameType, redis: Database ): Promise<void> {
	const client = GachaClientFactory.createClient( gameType );
	const gameConfig = client.getGameConfig();
	
	const key = generateRedisKey( DB_KEY_GACHA_URL, {
		qq: userId,
		sn,
		prefix: gameConfig.redisPrefix
	} );
	const htmlKey = generateRedisKey( DB_KEY_GACHA_HTML_URL, {
		qq: userId,
		sn,
		prefix: gameConfig.redisPrefix
	} );
	
	await redis.deleteKey( key, htmlKey );
}

// 默认导出ZZZ分析指令（保持向后兼容）
export default defineDirective( "order", async ( input ) => {
	const { sendMessage, messageData, redis, logger, matchResult } = input;
	const gameTypeStr = matchResult.match[0];
	let sn: string = "1";
	let inputUrl: string = "";
	if ( matchResult.match.length > 1 ) {
		const match = matchResult.match[1];
		const isNumber = Number.isFinite( parseInt( match ) );
		sn = isNumber ? match : "1";
		inputUrl = isNumber ? "" : match;
	}
	const gameType = parseGameType( gameTypeStr );
	const { sender: { user_id }, raw_message } = messageData;
	
	// 获取游戏配置
	const client = GachaClientFactory.createClient( gameType );
	const gameConfig = client.getGameConfig();
	
	logger.info( `[${ gameConfig.name }抽卡分析] 用户 ${ user_id } 发起抽卡分析请求，消息: ${ raw_message }` );
	
	// 确定URL获取方式并处理
	let urlResult: { success: true; url: string } | { success: false; error: string };
	
	if ( isValidURL( inputUrl ) ) {
		// URL方式
		logger.info( `[${ gameConfig.name }抽卡分析] 用户 ${ user_id } 使用URL方式获取抽卡记录` );
		urlResult = await handleURLInput( inputUrl, user_id, gameType, redis, logger );
	} else {
		// Cookie方式
		logger.info( `[${ gameConfig.name }抽卡分析] 用户 ${ user_id } 使用Cookie方式获取抽卡记录，sn: ${ sn }` );
		urlResult = await handleCookieInput( sn, user_id, gameType );
	}
	
	// 检查URL获取结果
	if ( !urlResult.success ) {
		logger.error( `[${ gameConfig.name }抽卡分析] URL获取失败: ${ urlResult.error }` );
		await sendMessage( urlResult.error );
		return;
	}
	
	const { url } = urlResult;
	
	// 加载抽卡数据
	try {
		logger.info( `[${ gameConfig.name }抽卡分析] 开始加载用户 ${ user_id } 的抽卡数据` );
		await client.loadData( url, user_id );
		logger.info( `[${ gameConfig.name }抽卡分析] 用户 ${ user_id } 抽卡数据加载成功` );
	} catch ( error ) {
		logger.error( `[${ gameConfig.name }抽卡分析] 用户 ${ user_id } 数据加载失败:`, error );
		await cleanupFailedCache( user_id, sn, gameType, redis );
		await sendMessage( `${ ERROR_MESSAGES.DATA_LOAD_FAILED }: ${ error }` );
		return;
	}
	
	// 渲染分析图片
	try {
		logger.info( `[${ gameConfig.name }抽卡分析] 开始渲染用户 ${ user_id } 的分析图片` );
		const content = await client.render( user_id );
		await sendMessage( content );
		logger.info( `[${ gameConfig.name }抽卡分析] 用户 ${ user_id } 分析图片渲染成功` );
	} catch ( error ) {
		logger.error( `[${ gameConfig.name }抽卡分析] 用户 ${ user_id } 图片渲染失败:`, error );
		await sendMessage( ERROR_MESSAGES.RENDER_FAILED );
	}
} );
