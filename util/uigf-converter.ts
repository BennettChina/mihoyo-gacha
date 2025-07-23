import {
	Gacha_Info,
	GameType,
	Standard_Gacha,
	UIGF_v4,
	UIGF_v4_Genshin_Account,
	UIGF_v4_Genshin_Item,
	UIGF_v4_Info,
	UIGF_v4_StarRail_Account,
	UIGF_v4_StarRail_Item,
	UIGF_v4_ZZZ_Account,
	UIGF_v4_ZZZ_Item
} from "./types";

/**
 * UIGF格式转换器
 * 负责在不同版本的UIGF格式之间进行转换
 */
export class UIGFConverter {
	
	/**
	 * 检测UIGF文件版本
	 */
	static detectVersion( data: any ): string {
		if ( data.info?.version ) {
			return data.info.version;
		}
		if ( data.info?.uigf_version ) {
			return data.info.uigf_version;
		}
		if ( data.info?.srgf_version ) {
			return data.info.srgf_version;
		}
		// 如果有hk4e、hkrpg、nap字段，可能是v4.0格式但缺少版本信息
		if ( data.hk4e || data.hkrpg || data.nap ) {
			return "v4.0";
		}
		// 默认认为是v3.0
		return "v3.0";
	}
	
	/**
	 * 验证UIGF v4.0格式数据
	 */
	static validateUIGF_v4( data: any ): { valid: boolean; errors: string[] } {
		const errors: string[] = [];
		
		// 检查根结构
		if ( !data.info ) {
			errors.push( "缺少 info 字段" );
		} else {
			if ( !data.info.export_timestamp ) {
				errors.push( "info.export_timestamp 字段缺失" );
			}
			if ( !data.info.export_app ) {
				errors.push( "info.export_app 字段缺失" );
			}
			if ( !data.info.export_app_version ) {
				errors.push( "info.export_app_version 字段缺失" );
			}
			if ( !data.info.version || !data.info.version.match( /^v\d+\.\d+$/ ) ) {
				errors.push( "info.version 字段格式错误，应为 'v{major}.{minor}' 格式" );
			}
		}
		
		// 检查游戏数据
		if ( !data.hk4e && !data.hkrpg && !data.nap ) {
			errors.push( "至少需要包含一个游戏的数据 (hk4e/hkrpg/nap)" );
		}
		
		// 验证原神数据
		if ( data.hk4e ) {
			this.validateGenshinData( data.hk4e, errors );
		}
		
		// 验证星铁数据
		if ( data.hkrpg ) {
			this.validateStarRailData( data.hkrpg, errors );
		}
		
		// 验证绝区零数据
		if ( data.nap ) {
			this.validateZZZData( data.nap, errors );
		}
		
		return {
			valid: errors.length === 0,
			errors
		};
	}
	
	/**
	 * 将内部抽卡数据转换为UIGF v4.0格式
	 */
	static convertToUIGF_v4(
		gachaDataMap: Map<GameType, Map<string, Gacha_Info[]>>,
		exportApp: string,
		exportAppVersion: string
	): UIGF_v4 {
		const info: UIGF_v4_Info = {
			export_timestamp: Math.floor( Date.now() / 1000 ),
			export_app: exportApp,
			export_app_version: exportAppVersion,
			version: "v4.0"
		};
		
		const result: UIGF_v4 = { info };
		
		// 处理原神数据
		if ( gachaDataMap.has( GameType.GENSHIN ) ) {
			result.hk4e = this.convertGenshinData( gachaDataMap.get( GameType.GENSHIN )! );
		}
		
		// 处理星铁数据
		if ( gachaDataMap.has( GameType.STAR_RAIL ) ) {
			result.hkrpg = this.convertStarRailData( gachaDataMap.get( GameType.STAR_RAIL )! );
		}
		
		// 处理绝区零数据
		if ( gachaDataMap.has( GameType.ZZZ ) ) {
			result.nap = this.convertZZZData( gachaDataMap.get( GameType.ZZZ )! );
		}
		
		return result;
	}
	
	/**
	 * 将UIGF v4.0格式转换为内部数据格式
	 */
	static convertFromUIGF_v4( data: UIGF_v4 ): Map<GameType, Map<string, Gacha_Info[]>> {
		const result = new Map<GameType, Map<string, Gacha_Info[]>>();
		
		// 处理原神数据
		if ( data.hk4e && data.hk4e.length > 0 ) {
			const genshinData = new Map<string, Gacha_Info[]>();
			data.hk4e.forEach( account => {
				const gachaList: Gacha_Info[] = account.list.map( item => ( {
					uid: account.uid.toString(),
					gacha_id: "", // 原神没有gacha_id
					gacha_type: item.gacha_type,
					item_id: item.item_id,
					count: item.count || "1",
					time: item.time,
					name: item.name || "",
					lang: account.lang || "zh-cn",
					item_type: item.item_type || "",
					rank_type: item.rank_type || "",
					id: item.id
				} ) );
				genshinData.set( account.uid.toString(), gachaList );
			} );
			result.set( GameType.GENSHIN, genshinData );
		}
		
		// 处理星铁数据
		if ( data.hkrpg && data.hkrpg.length > 0 ) {
			const starRailData = new Map<string, Gacha_Info[]>();
			data.hkrpg.forEach( account => {
				const gachaList: Gacha_Info[] = account.list.map( item => ( {
					uid: account.uid.toString(),
					gacha_id: item.gacha_id,
					gacha_type: item.gacha_type,
					item_id: item.item_id,
					count: item.count || "1",
					time: item.time,
					name: item.name || "",
					lang: account.lang || "zh-cn",
					item_type: item.item_type || "",
					rank_type: item.rank_type || "",
					id: item.id
				} ) );
				starRailData.set( account.uid.toString(), gachaList );
			} );
			result.set( GameType.STAR_RAIL, starRailData );
		}
		
		// 处理绝区零数据
		if ( data.nap && data.nap.length > 0 ) {
			const zzzData = new Map<string, Gacha_Info[]>();
			data.nap.forEach( account => {
				const gachaList: Gacha_Info[] = account.list.map( item => ( {
					uid: account.uid.toString(),
					gacha_id: item.gacha_id || "",
					gacha_type: item.gacha_type,
					item_id: item.item_id,
					count: item.count || "1",
					time: item.time,
					name: item.name || "",
					lang: account.lang || "zh-cn",
					item_type: item.item_type || "",
					rank_type: item.rank_type || "",
					id: item.id
				} ) );
				zzzData.set( account.uid.toString(), gachaList );
			} );
			result.set( GameType.ZZZ, zzzData );
		}
		
		return result;
	}
	
	/**
	 * 将旧版本格式转换为UIGF v4.0格式
	 */
	static convertLegacyToUIGF_v4(
		legacyData: Standard_Gacha,
		gameType: GameType,
		exportApp: string,
		exportAppVersion: string
	): UIGF_v4 {
		const info: UIGF_v4_Info = {
			export_timestamp: legacyData.info.export_timestamp,
			export_app: exportApp,
			export_app_version: exportAppVersion,
			version: "v4.0"
		};
		
		const result: UIGF_v4 = { info };
		const uid = legacyData.info.uid;
		const timezone = legacyData.info.region_time_zone;
		const lang = legacyData.info.lang;
		
		switch ( gameType ) {
			case GameType.GENSHIN:
				result.hk4e = [ {
					uid,
					timezone,
					lang,
					list: legacyData.list.map( item => ( {
						uigf_gacha_type: this.mapGenshinGachaType( item.gacha_type ),
						gacha_type: item.gacha_type,
						item_id: item.item_id,
						count: item.count,
						time: item.time,
						name: item.name,
						item_type: item.item_type,
						rank_type: item.rank_type,
						id: item.id
					} ) )
				} ];
				break;
			
			case GameType.STAR_RAIL:
				result.hkrpg = [ {
					uid,
					timezone,
					lang,
					list: legacyData.list.map( item => ( {
						gacha_type: item.gacha_type,
						gacha_id: item.gacha_id,
						item_id: item.item_id,
						count: item.count,
						time: item.time,
						name: item.name,
						item_type: item.item_type,
						rank_type: item.rank_type,
						id: item.id
					} ) )
				} ];
				break;
			
			case GameType.ZZZ:
				result.nap = [ {
					uid,
					timezone,
					lang,
					list: legacyData.list.map( item => ( {
						gacha_type: item.gacha_type,
						gacha_id: item.gacha_id,
						item_id: item.item_id,
						count: item.count,
						time: item.time,
						name: item.name,
						item_type: item.item_type,
						rank_type: item.rank_type,
						id: item.id
					} ) )
				} ];
				break;
		}
		
		return result;
	}
	
	/**
	 * 验证原神数据格式
	 */
	private static validateGenshinData( accounts: any[], errors: string[] ) {
		if ( !Array.isArray( accounts ) ) {
			errors.push( "hk4e 应为数组格式" );
			return;
		}
		
		accounts.forEach( ( account, index ) => {
			if ( !account.uid ) {
				errors.push( `hk4e[${ index }].uid 字段缺失` );
			}
			if ( typeof account.timezone !== 'number' ) {
				errors.push( `hk4e[${ index }].timezone 应为数字类型` );
			}
			if ( !Array.isArray( account.list ) ) {
				errors.push( `hk4e[${ index }].list 应为数组格式` );
			} else {
				account.list.forEach( ( item: any, itemIndex: number ) => {
					if ( !item.uigf_gacha_type ) {
						errors.push( `hk4e[${ index }].list[${ itemIndex }].uigf_gacha_type 字段缺失` );
					}
					if ( !item.gacha_type ) {
						errors.push( `hk4e[${ index }].list[${ itemIndex }].gacha_type 字段缺失` );
					}
					if ( item.item_id === undefined || item.item_id === null ) {
						errors.push( `hk4e[${ index }].list[${ itemIndex }].item_id 字段缺失` );
					}
					if ( !item.time ) {
						errors.push( `hk4e[${ index }].list[${ itemIndex }].time 字段缺失` );
					}
					if ( !item.id ) {
						errors.push( `hk4e[${ index }].list[${ itemIndex }].id 字段缺失` );
					}
				} );
			}
		} );
	}
	
	/**
	 * 验证星铁数据格式
	 */
	private static validateStarRailData( accounts: any[], errors: string[] ) {
		if ( !Array.isArray( accounts ) ) {
			errors.push( "hkrpg 应为数组格式" );
			return;
		}
		
		accounts.forEach( ( account, index ) => {
			if ( !account.uid ) {
				errors.push( `hkrpg[${ index }].uid 字段缺失` );
			}
			if ( typeof account.timezone !== 'number' ) {
				errors.push( `hkrpg[${ index }].timezone 应为数字类型` );
			}
			if ( !Array.isArray( account.list ) ) {
				errors.push( `hkrpg[${ index }].list 应为数组格式` );
			} else {
				account.list.forEach( ( item: any, itemIndex: number ) => {
					if ( !item.gacha_type ) {
						errors.push( `hkrpg[${ index }].list[${ itemIndex }].gacha_type 字段缺失` );
					}
					if ( !item.gacha_id ) {
						errors.push( `hkrpg[${ index }].list[${ itemIndex }].gacha_id 字段缺失` );
					}
					if ( !item.item_id ) {
						errors.push( `hkrpg[${ index }].list[${ itemIndex }].item_id 字段缺失` );
					}
					if ( !item.time ) {
						errors.push( `hkrpg[${ index }].list[${ itemIndex }].time 字段缺失` );
					}
					if ( !item.id ) {
						errors.push( `hkrpg[${ index }].list[${ itemIndex }].id 字段缺失` );
					}
				} );
			}
		} );
	}
	
	/**
	 * 验证绝区零数据格式
	 */
	private static validateZZZData( accounts: any[], errors: string[] ) {
		if ( !Array.isArray( accounts ) ) {
			errors.push( "nap 应为数组格式" );
			return;
		}
		
		accounts.forEach( ( account, index ) => {
			if ( !account.uid ) {
				errors.push( `nap[${ index }].uid 字段缺失` );
			}
			if ( typeof account.timezone !== 'number' ) {
				errors.push( `nap[${ index }].timezone 应为数字类型` );
			}
			if ( !Array.isArray( account.list ) ) {
				errors.push( `nap[${ index }].list 应为数组格式` );
			} else {
				account.list.forEach( ( item: any, itemIndex: number ) => {
					if ( !item.gacha_type ) {
						errors.push( `nap[${ index }].list[${ itemIndex }].gacha_type 字段缺失` );
					}
					if ( !item.item_id ) {
						errors.push( `nap[${ index }].list[${ itemIndex }].item_id 字段缺失` );
					}
					if ( !item.time ) {
						errors.push( `nap[${ index }].list[${ itemIndex }].time 字段缺失` );
					}
					if ( !item.id ) {
						errors.push( `nap[${ index }].list[${ itemIndex }].id 字段缺失` );
					}
				} );
			}
		} );
	}
	
	/**
	 * 转换原神数据到UIGF v4.0格式
	 */
	private static convertGenshinData( uidDataMap: Map<string, Gacha_Info[]> ): UIGF_v4_Genshin_Account[] {
		const accounts: UIGF_v4_Genshin_Account[] = [];
		
		for ( const [ uid, gachaList ] of uidDataMap ) {
			if ( gachaList.length === 0 ) continue;
			
			// 获取时区信息（从第一条记录中获取）
			const firstRecord = gachaList[0];
			const timezone = this.getTimezoneFromUID( uid );
			
			const items: UIGF_v4_Genshin_Item[] = gachaList.map( gacha => ( {
				uigf_gacha_type: this.mapGenshinGachaType( gacha.gacha_type ),
				gacha_type: gacha.gacha_type,
				item_id: gacha.item_id,
				count: gacha.count,
				time: gacha.time,
				name: gacha.name,
				item_type: gacha.item_type,
				rank_type: gacha.rank_type,
				id: gacha.id
			} ) );
			
			accounts.push( {
				uid,
				timezone,
				lang: firstRecord.lang,
				list: items
			} );
		}
		
		return accounts;
	}
	
	/**
	 * 转换星铁数据到UIGF v4.0格式
	 */
	private static convertStarRailData( uidDataMap: Map<string, Gacha_Info[]> ): UIGF_v4_StarRail_Account[] {
		const accounts: UIGF_v4_StarRail_Account[] = [];
		
		for ( const [ uid, gachaList ] of uidDataMap ) {
			if ( gachaList.length === 0 ) continue;
			
			const firstRecord = gachaList[0];
			const timezone = this.getTimezoneFromUID( uid );
			
			const items: UIGF_v4_StarRail_Item[] = gachaList.map( gacha => ( {
				gacha_type: gacha.gacha_type,
				gacha_id: gacha.gacha_id,
				item_id: gacha.item_id,
				count: gacha.count,
				time: gacha.time,
				name: gacha.name,
				item_type: gacha.item_type,
				rank_type: gacha.rank_type,
				id: gacha.id
			} ) );
			
			accounts.push( {
				uid,
				timezone,
				lang: firstRecord.lang,
				list: items
			} );
		}
		
		return accounts;
	}
	
	/**
	 * 转换绝区零数据到UIGF v4.0格式
	 */
	private static convertZZZData( uidDataMap: Map<string, Gacha_Info[]> ): UIGF_v4_ZZZ_Account[] {
		const accounts: UIGF_v4_ZZZ_Account[] = [];
		
		for ( const [ uid, gachaList ] of uidDataMap ) {
			if ( gachaList.length === 0 ) continue;
			
			const firstRecord = gachaList[0];
			const timezone = this.getTimezoneFromUID( uid );
			
			const items: UIGF_v4_ZZZ_Item[] = gachaList.map( gacha => ( {
				gacha_type: gacha.gacha_type,
				gacha_id: gacha.gacha_id,
				item_id: gacha.item_id,
				count: gacha.count,
				time: gacha.time,
				name: gacha.name,
				item_type: gacha.item_type,
				rank_type: gacha.rank_type,
				id: gacha.id
			} ) );
			
			accounts.push( {
				uid,
				timezone,
				lang: firstRecord.lang,
				list: items
			} );
		}
		
		return accounts;
	}
	
	/**
	 * 根据UID获取时区
	 */
	private static getTimezoneFromUID( uid: string ): number {
		const firstChar = uid[0];
		switch ( firstChar ) {
			case "6":
				return -5; // 美服
			case "7":
				return 1;  // 欧服
			case "8":
				return 8;  // 亚服
			case "9":
				return 8;  // 港澳台服
			default:
				return 8;   // 国服等
		}
	}
	
	/**
	 * 映射原神抽卡类型到UIGF抽卡类型
	 */
	private static mapGenshinGachaType( gachaType: string ): string {
		// 原神的gacha_type映射到uigf_gacha_type
		const mapping: Record<string, string> = {
			"100": "100", // 新手祈愿
			"200": "200", // 常驻祈愿
			"301": "301", // 角色活动祈愿
			"302": "302", // 武器活动祈愿
			"400": "301", // 角色活动祈愿-2（映射到301）
			"500": "500"  // 集录祈愿
		};
		return mapping[gachaType] || gachaType;
	}
}
