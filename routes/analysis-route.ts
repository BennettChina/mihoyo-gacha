import express from "express";
import bot from "ROOT";
import { generateRedisKey, sortRecords } from "#/mihoyo-gacha/util/util";
import { Gacha_Info, GachaData, GameType } from "#/mihoyo-gacha/util/types";
import { DB_KEY_CURRENT_ID, DB_KEY_GACHA_DATA } from "#/mihoyo-gacha/util/constants";
import { GachaClientFactory } from "#/mihoyo-gacha/module/client-factory";

const router = express.Router();

/**
 * 获取抽卡分析数据的通用函数
 * @param gameType 游戏类型
 * @param qq 用户QQ号
 * @returns 抽卡数据结果
 */
async function getGachaAnalysisData( gameType: GameType, qq: number ) {
	try {
		// 获取游戏客户端和配置
		const client = GachaClientFactory.createClient( gameType );
		const gameConfig = client.getGameConfig();
		
		// 生成当前用户ID的数据库键
		const currentUidDbKey = generateRedisKey( DB_KEY_CURRENT_ID, {
			qq: qq.toString(),
			prefix: gameConfig.redisPrefix
		} );
		
		// 获取用户UID
		const uid = await bot.redis.getHashField( currentUidDbKey, "uid" );
		if ( !uid ) {
			return {
				success: false,
				error: `暂无${ gameConfig.name }默认账号的历史记录`,
				data: [],
				uid: null
			};
		}
		
		// 获取抽卡数据
		const dataRes: GachaData[] = [];
		const gachaTypes = gameConfig.gachaTypes;
		const sortedGachaTypes = gameConfig.sortedGachaTypes;
		
		for ( const gachaType of sortedGachaTypes ) {
			try {
				const dbKey = generateRedisKey( DB_KEY_GACHA_DATA, {
					gacha_type: gachaType,
					uid: uid,
					prefix: gameConfig.redisPrefix
				} );
				
				const data: Record<string, string> = await bot.redis.getHash( dbKey );
				const records: Gacha_Info[] = Object.values( data )
					.map( __data => JSON.parse( __data ) )
					.sort( ( prev, curr ) => sortRecords( prev, curr ) );
				
				dataRes.push( {
					key: gachaType,
					name: gachaTypes[gachaType],
					data: records
				} );
			} catch ( error ) {
				bot.logger.error( `[${ gameConfig.name }抽卡分析] ${ gachaType }: `, error );
			}
		}
		// 获取原神的 400 卡池
		if ( gameType === GameType.GENSHIN ) {
			try {
				const dbKey = generateRedisKey( DB_KEY_GACHA_DATA, {
					gacha_type: "400",
					uid: uid,
					prefix: gameConfig.redisPrefix
				} );
				
				// 合并 400 至 301 中，并根据 ID 进行去重
				const data: Record<string, string> = await bot.redis.getHash( dbKey );
				const _301 = dataRes.find( item => item.key === "301" );
				if ( _301 ) {
					_301.data = [
						..._301.data,
						...Object.values( data ).map( __data => JSON.parse( __data ) )
					].filter( ( item, index, self ) => {
						return self.findIndex( t => t.id === item.id ) === index;
					} ).sort( ( prev, curr ) => sortRecords( prev, curr ) );
				}
			} catch ( error ) {
				bot.logger.error( `[${ gameConfig.name }抽卡分析] 400: `, error );
			}
		}
		
		// 统计分析抽卡数据
		const analysisData = await client.analysisData( dataRes );
		
		return {
			success: true,
			data: analysisData,
			uid: uid,
			gameInfo: {
				name: gameConfig.name,
				type: gameType
			}
		};
	} catch ( error ) {
		bot.logger.error( `[抽卡分析] 获取数据失败:`, error );
		return {
			success: false,
			error: `获取数据失败: ${ error }`,
			data: {},
			uid: null
		};
	}
}

router.get( "/result", async ( req, res ) => {
	try {
		const qq: number = parseInt( <string>req.query.qq );
		const gameType: GameType = <GameType>req.query.game || GameType.GENSHIN;
		
		if ( !qq || isNaN( qq ) ) {
			return res.status( 400 ).json( {
				success: false,
				error: "缺少有效的QQ参数"
			} );
		}
		
		// 验证游戏类型
		if ( !Object.values( GameType ).includes( gameType ) ) {
			return res.status( 400 ).json( {
				success: false,
				error: `不支持的游戏类型: ${ gameType }`
			} );
		}
		
		const result = await getGachaAnalysisData( gameType, qq );
		
		if ( !result.success ) {
			return res.status( 404 ).json( result );
		}
		
		res.json( result );
	} catch ( error ) {
		bot.logger.error( "[抽卡分析路由] 处理请求失败:", error );
		res.status( 500 ).json( {
			success: false,
			error: "服务器内部错误"
		} );
	}
} );

/**
 * 获取用户信息并存储到Redis
 * @param qq 用户QQ号
 * @param gameType 游戏类型
 */
async function getUserInfo( qq: number, gameType: GameType ): Promise<Record<string, any>> {
	// 获取用户UID
	const client = GachaClientFactory.createClient( gameType );
	return await client.getUserInfo( qq );
}

/**
 * 获取用户信息API
 */
router.get( "/user-info", async ( req, res ) => {
	try {
		const qq: number = parseInt( <string>req.query.qq );
		const gameType: GameType = <GameType>req.query.game || GameType.GENSHIN;
		
		if ( !qq || isNaN( qq ) ) {
			return res.status( 400 ).json( {
				success: false,
				error: "缺少有效的QQ参数"
			} );
		}
		
		// 获取游戏客户端和配置
		const client = GachaClientFactory.createClient( gameType );
		const gameConfig = client.getGameConfig();
		
		const userInfo = await getUserInfo( qq, gameType );
		
		
		if ( !userInfo.uid ) {
			return res.status( 404 ).json( {
				success: false,
				error: `暂无${ gameConfig.name }账号信息`
			} );
		}
		
		if ( !userInfo.avatar ) {
			userInfo.avatar = await client.getUserAvatar( qq, userInfo.uid, userInfo.region, gameType );
		}
		
		
		res.json( {
			success: true,
			userInfo: {
				uid: userInfo.uid,
				region: userInfo.region,
				region_time_zone: userInfo.region_time_zone,
				nickname: userInfo.nickname,
				level: userInfo.level,
				serverName: userInfo.serverName,
				avatar: userInfo.avatar
			},
			gameInfo: {
				name: gameConfig.name,
				type: gameType
			}
		} );
	} catch ( error ) {
		bot.logger.error( "[用户信息路由] 处理请求失败:", error );
		res.status( 500 ).json( {
			success: false,
			error: "服务器内部错误"
		} );
	}
} );

/**
 * 获取游戏配置信息API
 */
router.get( "/game-config", async ( req, res ) => {
	try {
		const gameType: GameType = <GameType>req.query.game || GameType.GENSHIN;
		
		// 验证游戏类型
		if ( !Object.values( GameType ).includes( gameType ) ) {
			return res.status( 400 ).json( {
				success: false,
				error: `不支持的游戏类型: ${ gameType }`
			} );
		}
		
		// 获取游戏配置
		const client = GachaClientFactory.createClient( gameType );
		const gameConfig = client.getGameConfig();
		
		res.json( {
			success: true,
			gameConfig: {
				name: gameConfig.name,
				type: gameType,
				gachaTypes: gameConfig.gachaTypes,
				redisPrefix: gameConfig.redisPrefix
			}
		} );
	} catch ( error ) {
		bot.logger.error( "[游戏配置路由] 处理请求失败:", error );
		res.status( 500 ).json( {
			success: false,
			error: "服务器内部错误"
		} );
	}
} );

/**
 * 获取支持的游戏列表API
 */
router.get( "/supported-games", async ( req, res ) => {
	try {
		const supportedGames = Object.values( GameType ).map( gameType => {
			const client = GachaClientFactory.createClient( gameType );
			const gameConfig = client.getGameConfig();
			
			return {
				type: gameType,
				name: gameConfig.name,
				gachaTypesCount: Object.keys( gameConfig.gachaTypes ).length
			};
		} );
		
		res.json( {
			success: true,
			supportedGames
		} );
	} catch ( error ) {
		bot.logger.error( "[支持游戏列表路由] 处理请求失败:", error );
		res.status( 500 ).json( {
			success: false,
			error: "服务器内部错误"
		} );
	}
} );

export default router;