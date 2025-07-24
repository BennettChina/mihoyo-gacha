import Database from "@/modules/database";
import { generateRedisKey } from "#/mihoyo-gacha/util/util";
import { DB_KEY_CURRENT_ID, DB_KEY_GACHA_DATA, DB_KEY_MIGRATION_STATUS } from "#/mihoyo-gacha/util/constants";
import { GachaClientFactory } from "#/mihoyo-gacha/module/client-factory";
import { GameType } from "#/mihoyo-gacha/util/types";
import { Logger } from "log4js";

/**
 * 将之前存储在不同 key 中的数据迁移到新的 key 中
 */
export class Migration {
	private readonly redis: Database;
	private readonly logger: Logger;
	private readonly genshin_keys: string[] = [
		"genshin_draw_analysis_data-100-*",
		"genshin_draw_analysis_data-200-*",
		"genshin_draw_analysis_data-301-*",
		"genshin_draw_analysis_data-302-*",
		"genshin_draw_analysis_data-400-*",
		"genshin_draw_analysis_data-500-*"
	];
	private readonly star_rail_keys: string[] = [
		"sr_gacha.data.*.1",
		"sr_gacha.data.*.2",
		"sr_gacha.data.*.11",
		"sr_gacha.data.*.12",
	];
	
	private readonly genshin_user_keys: string = "genshin_draw_analysis_curr_uid-*";
	private readonly star_rail_user_keys: string = "sr_gacha.analysis.curr_uid:*";
	
	constructor( redis: Database, logger: Logger ) {
		this.redis = redis;
		this.logger = logger;
	}
	
	/**
	 * 迁移数据
	 */
	public async migrate(): Promise<void> {
		const status = await this.redis.getString( DB_KEY_MIGRATION_STATUS );
		if ( status === "done" ) {
			return;
		}
		this.logger.info( "[miHoYo抽卡分析] 开始迁移数据" );
		await this.migrateGenshinData();
		await this.migrateStarRailData();
		await this.redis.setString( DB_KEY_MIGRATION_STATUS, "done" );
	}
	
	private async migrateGenshinData() {
		const client = GachaClientFactory.createClient( GameType.GENSHIN );
		const uidSet = new Set<string>();
		const gameConfig = client.getGameConfig();
		let row = 0;
		// 迁移抽卡记录数据
		for ( const key of this.genshin_keys ) {
			const keys = await this.redis.client.keys( key );
			for ( const k of keys ) {
				const data = await this.redis.getHash( k );
				// 获取 gacha_type、uid
				const [ , gacha_type, uid ] = k.split( "-" );
				const new_key = generateRedisKey( DB_KEY_GACHA_DATA, {
					gacha_type,
					uid,
					prefix: gameConfig.redisPrefix
				} );
				await this.redis.setHash( new_key, data );
				uidSet.add( uid );
				row += Object.keys( data ).length;
			}
		}
		// 迁移用户数据
		const user_keys = await this.redis.client.keys( this.genshin_user_keys );
		for ( const k of user_keys ) {
			const [ , qq ] = k.split( "-" );
			const uid = await this.redis.getString( k );
			if ( !uid ) continue;
			const new_key = generateRedisKey( DB_KEY_CURRENT_ID, {
				qq,
				prefix: gameConfig.redisPrefix
			} );
			await this.redis.setHash( new_key, { uid } );
		}
		this.logger.info( `[${ gameConfig.name }] 迁移了 ${ row } 条 抽卡记录数据，涉及 ${ uidSet.size } 个账号` );
	}
	
	private async migrateStarRailData() {
		const client = GachaClientFactory.createClient( GameType.STAR_RAIL );
		const gameConfig = client.getGameConfig();
		const uidSet = new Set<string>();
		let row = 0;
		// 迁移抽卡记录数据
		for ( const key of this.star_rail_keys ) {
			const keys = await this.redis.client.keys( key );
			for ( const k of keys ) {
				const data = await this.redis.getHash( k );
				// 获取 uid、gacha_type
				const [ , , uid, gacha_type ] = k.split( "." );
				const new_key = generateRedisKey( DB_KEY_GACHA_DATA, {
					gacha_type,
					uid,
					prefix: gameConfig.redisPrefix
				} );
				await this.redis.setHash( new_key, data );
				uidSet.add( uid );
				row += Object.keys( data ).length;
			}
		}
		// 迁移用户数据
		const user_keys = await this.redis.client.keys( this.star_rail_user_keys );
		for ( const k of user_keys ) {
			const [ , qq ] = k.split( ":" );
			const data = await this.redis.getHash( k );
			if ( !data.uid ) continue;
			const new_key = generateRedisKey( DB_KEY_CURRENT_ID, {
				qq,
				prefix: gameConfig.redisPrefix
			} );
			await this.redis.setHash( new_key, data );
		}
		this.logger.info( `[${ gameConfig.name }] 迁移了 ${ row } 条 抽卡记录数据，涉及 ${ uidSet.size } 个账号` );
	}
}