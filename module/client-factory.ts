import { ClientConfig, GameType, ServerType } from "../util/types";
import { getGameConfig, getGameConfigByGameBiz, getGameConfigByGameId } from "../util/game-configs";
import { IGachaClient, UniversalGachaClient } from "./client";

/**
 * 游戏客户端工厂类
 * 负责创建和管理不同游戏的抽卡客户端实例
 */
export class GachaClientFactory {
	private static clientCache = new Map<string, IGachaClient>();
	
	/**
	 * 根据游戏类型创建客户端
	 * @param gameType 游戏类型
	 * @param serverType 服务器类型，默认为国服
	 * @param debug 是否启用调试模式
	 */
	public static createClient(
		gameType: GameType,
		serverType: ServerType = ServerType.CN,
		debug: boolean = false
	): IGachaClient {
		const cacheKey = `${ gameType }-${ serverType }-${ debug }`;
		
		// 检查缓存
		if ( this.clientCache.has( cacheKey ) ) {
			return this.clientCache.get( cacheKey )!;
		}
		
		// 获取游戏配置
		const gameConfig = getGameConfig( gameType );
		if ( !gameConfig ) {
			throw new Error( `不支持的游戏类型: ${ gameType }` );
		}
		
		// 创建客户端配置
		const clientConfig: ClientConfig = {
			gameConfig,
			serverType,
			debug
		};
		
		// 创建客户端实例
		const client = new UniversalGachaClient( clientConfig );
		
		// 缓存客户端实例
		this.clientCache.set( cacheKey, client );
		
		return client;
	}
	
	/**
	 * 根据游戏ID创建客户端
	 * @param gameId 游戏ID
	 * @param serverType 服务器类型，默认为国服
	 * @param debug 是否启用调试模式
	 */
	public static createClientByGameId(
		gameId: number,
		serverType: ServerType = ServerType.CN,
		debug: boolean = false
	): IGachaClient {
		const gameConfig = getGameConfigByGameId( gameId );
		if ( !gameConfig ) {
			throw new Error( `不支持的游戏ID: ${ gameId }` );
		}
		
		return this.createClient( gameConfig.type, serverType, debug );
	}
	
	/**
	 * 根据game_biz创建客户端
	 * @param gameBiz 游戏业务标识
	 * @param debug 是否启用调试模式
	 */
	public static createClientByGameBiz(
		gameBiz: string,
		debug: boolean = false
	): IGachaClient {
		const result = getGameConfigByGameBiz( gameBiz );
		if ( !result ) {
			throw new Error( `不支持的游戏业务标识: ${ gameBiz }` );
		}
		
		const { config, serverType } = result;
		const serverTypeEnum = serverType === 'cn' ? ServerType.CN : ServerType.OS;
		
		return this.createClient( config.type, serverTypeEnum, debug );
	}
	
	/**
	 * 获取ZZZ客户端
	 * @param serverType 服务器类型，默认为国服
	 * @param debug 是否启用调试模式
	 */
	public static getZZZClient(
		serverType: ServerType = ServerType.CN,
		debug: boolean = false
	): IGachaClient {
		return this.createClient( GameType.ZZZ, serverType, debug );
	}
	
	/**
	 * 获取星铁客户端
	 * @param serverType 服务器类型，默认为国服
	 * @param debug 是否启用调试模式
	 */
	public static getStarRailClient(
		serverType: ServerType = ServerType.CN,
		debug: boolean = false
	): IGachaClient {
		return this.createClient( GameType.STAR_RAIL, serverType, debug );
	}
	
	/**
	 * 获取原神客户端
	 * @param serverType 服务器类型，默认为国服
	 * @param debug 是否启用调试模式
	 */
	public static getGenshinClient(
		serverType: ServerType = ServerType.CN,
		debug: boolean = false
	): IGachaClient {
		return this.createClient( GameType.GENSHIN, serverType, debug );
	}
	
	/**
	 * 清除客户端缓存
	 * @param gameType 可选，指定清除特定游戏的缓存
	 */
	public static clearCache( gameType?: GameType ): void {
		if ( gameType ) {
			// 清除特定游戏的缓存
			const keysToDelete = Array.from( this.clientCache.keys() )
				.filter( key => key.startsWith( gameType ) );
			keysToDelete.forEach( key => this.clientCache.delete( key ) );
		} else {
			// 清除所有缓存
			this.clientCache.clear();
		}
	}
	
	/**
	 * 获取缓存统计信息
	 */
	public static getCacheStats(): {
		totalClients: number;
		clientsByGame: Record<string, number>;
	} {
		const totalClients = this.clientCache.size;
		const clientsByGame: Record<string, number> = {};
		
		for ( const key of this.clientCache.keys() ) {
			const gameType = key.split( '-' )[0];
			clientsByGame[gameType] = ( clientsByGame[gameType] || 0 ) + 1;
		}
		
		return {
			totalClients,
			clientsByGame
		};
	}
}

/**
 * 便捷的客户端创建函数
 */
export const createGachaClient = GachaClientFactory.createClient;
export const createGachaClientByGameId = GachaClientFactory.createClientByGameId;
export const createGachaClientByGameBiz = GachaClientFactory.createClientByGameBiz;
