import { defineDirective } from "@/modules/command";
import { GachaClientFactory } from "#/mihoyo-gacha/module/client-factory";
import { generateRedisKey } from "#/mihoyo-gacha/util/util";
import { DB_KEY_CURRENT_ID } from "#/mihoyo-gacha/util/constants";
import { parseGameType } from "#/mihoyo-gacha/util/game-configs";


// 默认导出ZZZ历史记录指令（保持向后兼容）
export default defineDirective( "order", async ( input ) => {
	const { sendMessage, messageData, redis, logger, matchResult } = input;
	const { sender: { user_id }, raw_message } = messageData;
	const gameTypeStr = matchResult.match[0];
	const gameType = parseGameType( gameTypeStr );
	
	// 获取游戏配置和客户端
	const client = GachaClientFactory.createClient( gameType );
	const gameConfig = client.getGameConfig();
	
	// 生成当前用户ID的数据库键
	const currentUidDbKey = generateRedisKey( DB_KEY_CURRENT_ID, {
		qq: user_id,
		prefix: gameConfig.redisPrefix
	} );
	
	// 获取用户UID
	let uid = '';
	try {
		uid = await redis.getHashField( currentUidDbKey, "uid" );
	} catch ( error ) {
		await sendMessage( `暂无${ gameConfig.name }历史记录` );
		return;
	}
	
	if ( !uid ) {
		await sendMessage( `暂无${ gameConfig.name }历史记录` );
		return;
	}
	
	// 使用通用客户端渲染历史记录
	try {
		logger.info( `[${ gameConfig.name }抽卡历史] 开始渲染用户 ${ user_id } 的历史记录，样式: ${ raw_message || '默认' }` );
		const content = await client.render( user_id );
		await sendMessage( content );
		logger.info( `[${ gameConfig.name }抽卡历史] 用户 ${ user_id } 历史记录渲染成功` );
	} catch ( error ) {
		logger.error( `[${ gameConfig.name }抽卡历史] 用户 ${ user_id } 图片渲染失败:`, error );
		await sendMessage( `${ gameConfig.name }图片渲染失败，请重试。` );
	}
} );
