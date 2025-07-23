import { defineDirective } from "@/modules/command";
import { GachaClientFactory } from "#/mihoyo-gacha/module/client-factory";
import { generateRedisKey } from "#/mihoyo-gacha/util/util";
import { DB_KEY_CURRENT_ID, DB_KEY_GACHA_DATA } from "#/mihoyo-gacha/util/constants";
import { parseGameType } from "#/mihoyo-gacha/util/game-configs";

export default defineDirective( "order", async ( {
	                                                 sendMessage,
	                                                 matchResult,
	                                                 messageData: { sender: { user_id } },
	                                                 redis
                                                 } ) => {
	const gameTypeStr = matchResult.match[0];
	const gameType = parseGameType( gameTypeStr );
	
	// 获取游戏配置
	const client = GachaClientFactory.createClient( gameType );
	const gameConfig = client.getGameConfig();
	
	// 生成当前用户ID的数据库键
	const currentUidDbKey = generateRedisKey( DB_KEY_CURRENT_ID, {
		qq: user_id,
		prefix: gameConfig.redisPrefix
	} );
	
	// 获取用户UID
	let uid: string;
	try {
		uid = await redis.getHashField( currentUidDbKey, "uid" );
	} catch ( error ) {
		await sendMessage( `暂无${ gameConfig.name }默认账号的历史记录` );
		return;
	}
	
	if ( !uid ) {
		await sendMessage( `暂无${ gameConfig.name }默认账号的历史记录` );
		return;
	}
	
	// 收集需要删除的键
	const keys: string[] = [ currentUidDbKey ];
	
	// 遍历所有抽卡类型，添加对应的数据键
	const gachaTypes = Object.keys( gameConfig.gachaTypes );
	for ( const gachaType of gachaTypes ) {
		const dbKey = generateRedisKey( DB_KEY_GACHA_DATA, {
			uid,
			gacha_type: gachaType,
			prefix: gameConfig.redisPrefix
		} );
		keys.push( dbKey );
	}
	
	// 删除所有相关数据
	await redis.deleteKey( ...keys );
	
	await sendMessage( `已清除${ gameConfig.name }账号 ${ uid } 的抽卡统计数据。` );
} );
