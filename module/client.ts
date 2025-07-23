import { Viewport } from "puppeteer";
import { RenderResult } from "@/modules/renderer";
import { gameAvatar, historyUpItem, renderer } from "#/mihoyo-gacha/init";
import { Sendable } from "@/modules/lib";
import { sleep } from "@/utils/async";
import { generateRedisKey, getValueOrDefault, htmlDecode, obj2ParamsStr, sortRecords } from "#/mihoyo-gacha/util/util";
import {
	DB_EXPIRE_24H,
	DB_KEY_CURRENT_ID,
	DB_KEY_GACHA_DATA,
	DB_KEY_GACHA_HTML_URL,
	DB_KEY_GACHA_URL
} from "#/mihoyo-gacha/util/constants";
import bot from "ROOT";
import { getBaseInfo } from "#/genshin/utils/api";
import { Private } from "#/genshin/module/private/main";
import { getPrivateAccount } from "#/genshin/utils/private";
import { getAuthKey, getUserFullInfo, updatePoolId } from "#/mihoyo-gacha/api/api";
import {
	AnalysisData,
	AuthKey,
	ClientConfig,
	GachaAnalysisChartData,
	GachaAnalysisPool,
	GachaAnalysisPoolItem,
	GachaAnalysisResult,
	GachaData,
	GachaPoolInfo,
	GachaUpItem,
	GachaURL,
	GachaUserInfo,
	GameConfig,
	GameType,
	ServerType
} from "#/mihoyo-gacha/util/types";
import { getServerType } from "#/mihoyo-gacha/util/game-configs";
import fetch from "node-fetch";
import moment from "moment";
import { Account } from "#/mihoyo-gacha/module/account";
import { numberToChinese } from "#/mihoyo-gacha/util/format";

/**
 * 成就数据收集结构
 */
interface AchievementData {
	consecutiveNonCrooked: number; // 当前连续不歪次数
	maxConsecutiveNonCrooked: number; // 最大连续不歪次数
	consecutivePity: number; // 当前连续大保底次数
	maxConsecutivePity: number; // 最大连续大保底次数
	// 十连统计
	tenPullStats: Array<{
		fiveStarCount: number;
		fourStarCount: number;
		pullNumbers: number[];
		poolType: string;
	}>;
	// 单抽统计
	singlePullStats: Array<{
		pullCount: number;
		isFiveStar: boolean;
		poolType: string;
	}>;
	// 所有5星的抽数记录
	allFiveStarPulls: number[];
	// 所有4星的抽数记录
	allFourStarPulls: number[];
}

/**
 * 通用抽卡客户端接口
 */
export interface IGachaClient {
	/** 渲染分析图片 */
	render( userId: number ): Promise<Sendable>;
	/** 获取抽卡记录URL */
	getURL( sn: string, userId: number ): Promise<string>;
	/** 加载抽卡数据 */
	loadData( url: string, userId: number ): Promise<void>;
	/** 获取游戏配置 */
	getGameConfig(): GameConfig;
	/** 分析抽卡数据 */
	analysisData( dataRes: any[] ): Promise<GachaAnalysisResult>;
	
	/** 获取用户信息 */
	getUserInfo( userId: number ): Promise<GachaUserInfo>;
	
	/** 获取用户头像 */
	getUserAvatar( userId: number, uid: number, server: string, gameType: GameType ): Promise<string>;
}

/**
 * 通用抽卡客户端实现
 */
export class UniversalGachaClient implements IGachaClient {
	private readonly config: ClientConfig;
	private readonly unknown_id = "9999999999";
	
	constructor( config: ClientConfig ) {
		this.config = config;
	}
	
	/**
	 * 分析抽卡数据
	 * @param dataRes 抽卡记录数据
	 */
	public async analysisData( dataRes: GachaData[] ): Promise<GachaAnalysisResult> {
		const { s, a } = this.config.gameConfig.rankType;
		const { character, weapon } = this.config.gameConfig.itemType;
		// 历史UP角色和武器
		const upCharacter: GachaUpItem[] = await historyUpItem.get( this.config.gameConfig.type, 'character' );
		const upWeapon: GachaUpItem[] = await historyUpItem.get( this.config.gameConfig.type, 'weapon' );
		const {
			character: characterType,
			weapon: weaponType,
			permanent,
			beginner,
			special
		} = this.config.gameConfig.gachaType;
		// 总抽卡数
		let totalPulls = 0;
		// UP角色个数
		let upCharacterCount = 0;
		// UP武器个数
		let upWeaponCount = 0;
		// 常驻池中的5星角色数
		let permanent5Count = 0;
		// UP角色池总抽数
		let upCharacterPulls = 0;
		// UP武器池总抽数
		let upWeaponPulls = 0;
		// 常驻池总抽数
		let permanentCount = 0;
		// 4星个数
		let aRankCount = 0;
		// 不歪的角色数
		let notCrookedCount = 0;
		// 不歪的武器数
		let notCrookedWeaponCount = 0;
		// UP角色池中每个UP角色的抽数之和
		let upCharacterCountSum = 0;
		// UP武器池中每个UP武器的抽数之和
		let upWeaponCountSum = 0;
		// 常驻池中每个5星的抽数之和
		let permanentCountSum = 0;
		// 所有卡池 每个4 星抽数之和
		let aRankCountSum = 0;
		// 角色池5星角色数
		let characterCount = 0;
		// 武器池5星武器数
		let weaponCount = 0;
		// 最钟爱你的 TA
		let favorite = "";
		// 最钟爱你的 TA 的抽卡数
		let favoriteCount = 999;
		
		// 初始化成就数据收集
		const achievementData: AchievementData = {
			consecutiveNonCrooked: 0,
			maxConsecutiveNonCrooked: 0,
			consecutivePity: 0,
			maxConsecutivePity: 0,
			tenPullStats: [],
			singlePullStats: [],
			allFiveStarPulls: [],
			allFourStarPulls: []
		};
		
		const gachaPools: GachaAnalysisPool[] = [];
		for ( let element of dataRes ) {
			const pool: GachaAnalysisPool = {
				name: element.name,
				type: element.key,
				count: element.data.length,
				items: []
			};
			gachaPools.push( pool );
			// 总抽卡数
			totalPulls += element.data.length;
			let count = 0;
			let count4Rank = 0;
			let upCount = 0;
			let i = 0;
			// 下一个五星是否是大保底
			let isFinalGuarantee = false;
			element.data.sort( ( prev, curr ) => {
				// 按照时间升序排列
				return sortRecords( prev, curr );
			} );
			for ( let data of element.data ) {
				count++;
				upCount++;
				count4Rank++;
				if ( data.rank_type === s ) {
					let isUp = true;
					if ( element.key === permanent ) { // 常驻池
						permanent5Count++;
						permanentCountSum += count;
					} else if ( element.key === beginner ) { // 新手池
						// 新手池不统计
					} else if ( characterType.includes( element.key ) ) { // 角色池
						const upCharacterNames = upCharacter.filter( item => {
							return moment( data.time ).isBetween( item.begin_time, item.end_time );
						} ).map( item => item.name );
						isUp = upCharacterNames.includes( data.name );
						if ( isUp ) {
							upCharacterCount++;
							notCrookedCount++;
						}
						characterCount++;
						upCharacterCountSum += count;
					} else if ( weaponType.includes( element.key ) ) { // 武器池
						const upWeaponNames = upWeapon.filter( item => {
							return data.time.localeCompare( item.begin_time ) >= 0
								&& data.time.localeCompare( item.end_time ) <= 0
						} ).map( item => item.name );
						isUp = upWeaponNames.includes( data.name );
						if ( isUp ) {
							upWeaponCount++;
							notCrookedWeaponCount++;
						}
						weaponCount++;
						upWeaponCountSum += count;
					} else if ( special?.includes( element.key ) ) { // 特殊池(集录祈愿、邦布频段)
						// 特殊池不计入歪的统计
						if ( data.item_type === character ) {
							upCharacterCountSum += count;
						} else if ( data.item_type === weapon ) {
							upWeaponCountSum += count;
						} else {
							// 邦布暂不统计
						}
					}
					
					// 收集成就数据 - 5星相关
					achievementData.allFiveStarPulls.push( count );
					achievementData.singlePullStats.push( {
						pullCount: count,
						isFiveStar: true,
						poolType: element.key
					} );
					
					// 连续不歪统计（仅限角色池和武器池）
					if ( characterType.includes( element.key ) || weaponType.includes( element.key ) ) {
						if ( isUp ) {
							achievementData.consecutiveNonCrooked++;
							achievementData.maxConsecutiveNonCrooked = Math.max(
								achievementData.maxConsecutiveNonCrooked,
								achievementData.consecutiveNonCrooked
							);
							
							// 不是大保底的 UP 就重置大保底连续次数
							if ( !isFinalGuarantee ) {
								achievementData.consecutivePity = 0;
							}
							// 抽到 UP 后就没大保底了，重置大保底标志
							isFinalGuarantee = false;
						} else {
							isFinalGuarantee = true;
							achievementData.consecutiveNonCrooked = 0; // 歪了重置
							// 大保底统计（歪了就算是大保底）
							achievementData.consecutivePity++;
							achievementData.maxConsecutivePity = Math.max(
								achievementData.maxConsecutivePity,
								achievementData.consecutivePity
							);
						}
					}
					const itemType = this.getItemType( data.item_type );
					const avatar = await gameAvatar.getAvatar( this.config.gameConfig.type, itemType, data.name );
					pool.items.push( {
						id: data.id,
						time: data.time,
						name: data.name,
						image: avatar?.item_icon || "",
						count,
						isCrooked: !isUp,
						rarity: 5
					} );
					// 更新最钟爱你的 TA（5星角色、武器、邦布）
					if ( count < favoriteCount ) {
						favorite = data.name;
						favoriteCount = count;
					}
					count = 0;
				}
				if ( characterType.includes( element.key ) ) {
					upCharacterPulls++;
				} else if ( weaponType.includes( element.key ) ) {
					upWeaponPulls++;
				} else if ( element.key === permanent ) {
					permanentCount++;
				}
				// 所有卡池4星统计
				if ( data.rank_type === a ) {
					aRankCount++;
					aRankCountSum += count4Rank;
					
					// 收集成就数据 - 4星相关
					achievementData.allFourStarPulls.push( count4Rank );
					achievementData.singlePullStats.push( {
						pullCount: count4Rank,
						isFiveStar: false,
						poolType: element.key
					} );
					
					count4Rank = 0;
				}
				if ( count > 0 && i === element.data.length - 1 ) {
					pool.items.push( {
						id: this.unknown_id,
						time: moment().format( "YYYY-MM-DD HH:mm:ss" ),
						name: "?",
						image: "question-mark",
						count,
						isCrooked: false,
						rarity: 5
					} );
				}
				i++;
			}
		}
		
		// 计算十连统计（基于抽卡记录的连续性分析）
		this.calculateTenPullStats( gachaPools, achievementData );
		
		// 平均每UP角色需要的抽数 = SUM(每个UP角色的抽数)/UP角色个数
		const upCharacterAverage = getValueOrDefault( upCharacterCountSum / upCharacterCount, 0 );
		// UP武器平均出货数 = SUM(每个UP武器的抽数)/UP武器个数
		const upWeaponAverage = getValueOrDefault( upWeaponCountSum / upWeaponCount, 0 );
		// 常驻平均出货数 = SUM(每个5星的抽数)/常驻总 5 星个数
		const permanentAverage = getValueOrDefault( permanentCountSum / permanent5Count, 0 );
		// 4星平均出货数 = SUM(每个4星的抽数)/4星个数
		const aRankAverage = getValueOrDefault( aRankCountSum / aRankCount, 0 );
		// UP角色概率 = 不歪的角色数 / 总的5星角色数
		const upCharacterRate = getValueOrDefault( notCrookedCount / characterCount * 100, 0 );
		// UP武器概率 = 不歪的武器数 / 总的5星武器数
		const upWeaponRate = getValueOrDefault( notCrookedWeaponCount / weaponCount * 100, 0 );
		
		// 计算成就评价
		const achievements = this.calculateAchievements( achievementData, totalPulls );
		
		const analysisData: AnalysisData = {
			achievement: achievements,
			totalPulls,
			upCharacterCount,
			upCharacterAverage: Number( upCharacterAverage.toFixed( 2 ) ),
			upCharacterRate: Number( upCharacterRate.toFixed( 2 ) ) + "%",
			permanentAverage: Number( permanentAverage.toFixed( 2 ) ),
			aRankCount,
			aRankAverage: Number( aRankAverage.toFixed( 2 ) ),
			upWeaponAverage: Number( upWeaponAverage.toFixed( 2 ) ),
			upWeaponRate: Number( upWeaponRate.toFixed( 2 ) ) + "%",
			upWeaponCount,
			upWeaponPulls,
			upCharacterPulls,
			favorite,
			favoriteCount
		};
		
		// 对每个卡池中的记录按照时间倒序排序
		gachaPools.forEach( pool => {
			pool.items = pool.items.sort( ( prev, curr ) => this.sortRecords( prev, curr ) );
		} );
		
		// 取角色池的最近10个记录作为折线图的数据
		const chartData: GachaAnalysisChartData = gachaPools.filter( pool => characterType.includes( pool.type ) )
			.map( pool => {
				const data = pool.items
					.filter( item => item.id !== this.unknown_id )
					.slice( 0, 10 )
					.reverse();
				return {
					type: "line",
					title: pool.name,
					data: data.map( item => ( {
						label: item.name,
						value: item.count
					} ) )
				}
			} )[0];
		return {
			analysisData: analysisData,
			gachaPools: gachaPools,
			chartData
		}
	}
	
	public getItemType( type: string ): 'character' | 'weapon' | 'bangboo' {
		const { character, weapon, assistant } = this.config.gameConfig.itemType;
		if ( type === character ) {
			return 'character';
		}
		if ( type === weapon ) {
			return 'weapon';
		}
		if ( type === assistant ) {
			return 'bangboo';
		}
		throw new Error( `不支持的物品类型: ${ type }` );
	}
	
	/**
	 * 获取游戏配置
	 */
	public getGameConfig(): GameConfig {
		return this.config.gameConfig;
	}
	
	/**
	 * 渲染分析图片
	 * @param userId 用户ID
	 */
	public async render( userId: number ): Promise<Sendable> {
		const viewport: Viewport = {
			width: 2000,
			height: 1000,
			deviceScaleFactor: 2
		};
		
		const templatePath = this.config.gameConfig.templatePath;
		const res: RenderResult = await renderer.asSegment( templatePath, {
			qq: userId,
			game: this.config.gameConfig.type
		}, viewport );
		
		if ( res.code === "ok" ) {
			return res.data;
		} else {
			throw new Error( res.error );
		}
	}
	
	/**
	 * 获取抽卡记录API地址
	 * @param sn 服务序号
	 * @param userId 用户QQ号
	 */
	public async getURL( sn: string, userId: number ): Promise<string> {
		const { gameConfig } = this.config;
		
		// 生成Redis键名
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
		
		// 检查缓存
		const cachedUrl = await bot.redis.getString( key );
		if ( cachedUrl ) {
			return cachedUrl;
		}
		
		// 获取私有账号信息
		const info: Private | string = await getPrivateAccount( userId, sn, bot.auth );
		if ( typeof info === "string" ) {
			throw info;
		}
		
		// 验证Cookie的有效性
		const { retcode, message, data } = await getBaseInfo( 100000001, info.setting.mysID, info.setting.cookie );
		
		if ( retcode !== 0 ) {
			throw message;
		} else if ( !data.list || data.list.length === 0 ) {
			throw "未查询到角色数据，请检查米哈游通行证（非UID）是否有误或是否设置角色信息公开";
		}
		
		// 查找对应游戏的角色数据
		const gameRole = data.list.find( el => el.gameId === gameConfig.gameId );
		if ( !gameRole ) {
			throw `未查询到${ gameConfig.name }角色数据，请检查米哈游通行证（非UID）是否有误或是否设置角色信息公开`;
		}
		
		const gameUid = gameRole.gameRoleId;
		const server = gameRole.region;
		const nickname = gameRole.nickname;
		const level = gameRole.level;
		const serverName = gameRole.regionName;
		this.config.serverType = getServerType( server );
		
		try {
			const { api_log_url, log_html_url, cookie }: GachaURL = await this.createURL(
				info.setting.stoken,
				gameUid,
				server
			);
			
			// 更新Cookie
			if ( cookie ) {
				await info.replaceCookie( cookie );
			}
			
			// 校验成功放入缓存，不需要频繁生成URL
			await bot.redis.setString( key, api_log_url, DB_EXPIRE_24H );
			await bot.redis.setString( htmlKey, log_html_url, DB_EXPIRE_24H );
			
			// save user info
			const currentUidDbKey = generateRedisKey( DB_KEY_CURRENT_ID, {
				qq: userId,
				prefix: gameConfig.redisPrefix
			} );
			await bot.redis.setHash( currentUidDbKey, {
				uid: gameUid,
				region: server,
				nickname,
				level,
				serverName
			} );
			
			return api_log_url;
		} catch ( error ) {
			throw error;
		}
	}
	
	/**
	 * 加载抽卡记录数据
	 * @param url 抽卡记录API地址
	 * @param userId 用户QQ号
	 */
	public async loadData( url: string, userId: number ): Promise<void> {
		const { gameConfig } = this.config;
		const gachaTypes = Object.keys( gameConfig.gachaTypes );
		const urlObj = new URL( htmlDecode( url ) );
		let page = 1;
		const size = 20;
		const defaultRegion = "prod_gf_cn";
		const defaultRegionTimeZone = 8;
		
		const info: GachaUserInfo = {
			uid: "",
			region: defaultRegion,
			region_time_zone: defaultRegionTimeZone
		};
		
		// 遍历所有抽卡类型
		for ( const gachaType of gachaTypes ) {
			let gachaId = '0';
			let length = size;
			
			// 分页获取数据
			label_type: do {
				const params = urlObj.searchParams;
				params.set( "page", `${ page }` );
				params.set( "size", `${ size }` );
				params.set( "end_id", gachaId );
				params.set( "gacha_type", gachaType );
				params.set( "real_gacha_type", gachaType[0] );
				
				// 设置game_biz参数
				if ( !params.has( "game_biz" ) ) {
					const gameBiz = this.config.serverType === ServerType.CN
						? gameConfig.gameBiz.cn
						: gameConfig.gameBiz.os;
					params.set( "game_biz", gameBiz );
				}
				
				const requestUrl = urlObj.toString().replace( /\+/g, "%2B" );
				const data = await this.getData( requestUrl );
				
				length = data.data.list.length;
				info.region = data.data.region || defaultRegion;
				info.region_time_zone = data.data.region_time_zone || defaultRegionTimeZone;
				
				// 处理每条抽卡记录
				for ( const element of data.data.list ) {
					gachaId = element.id;
					info.uid = element.uid;
					
					const dbKey = generateRedisKey( DB_KEY_GACHA_DATA, {
						gacha_type: gachaType,
						uid: info.uid,
						prefix: gameConfig.redisPrefix
					} );
					
					const hasKey = await bot.redis.existHashKey( dbKey, gachaId );
					if ( hasKey ) {
						page++;
						await sleep( 200 );
						break label_type;
					}
					
					await bot.redis.setHash( dbKey, { [gachaId]: JSON.stringify( element ) } );
				}
				
				page++;
				await sleep( 200 );
			} while ( length === size );
		}
		
		// 保存用户信息
		if ( info.uid ) {
			const dbKey = generateRedisKey( DB_KEY_CURRENT_ID, {
				qq: userId,
				prefix: gameConfig.redisPrefix
			} );
			await bot.redis.setHash( dbKey, { ...info } );
		}
	}
	
	async getUserInfo( userId: number ): Promise<GachaUserInfo> {
		// 生成当前用户ID的数据库键
		const currentUidDbKey = generateRedisKey( DB_KEY_CURRENT_ID, {
			qq: userId.toString(),
			prefix: this.config.gameConfig.redisPrefix
		} );
		const userInfo = await bot.redis.getHash( currentUidDbKey );
		const gachaUserInfo: GachaUserInfo = {
			uid: userInfo.uid,
			region: userInfo.region,
			region_time_zone: parseInt( userInfo.region_time_zone || "8" ),
			nickname: userInfo.nickname,
			level: userInfo.level,
			serverName: userInfo.serverName,
			avatar: userInfo.avatar
		};
		if ( userInfo.nickname ) {
			return gachaUserInfo;
		}
		
		try {
			const account = await new Account().getAccount( userId );
			const gameRole = account.games.find( el => el.gameId === this.config.gameConfig.gameId );
			if ( !gameRole ) {
				return gachaUserInfo;
			}
			const gameUid = userInfo.uid || gameRole.uid;
			const server = gameRole.region;
			const nickname = gameRole.nickname;
			const level = gameRole.level;
			const serverName = gameRole.regionName;
			
			await bot.redis.setHash( currentUidDbKey, {
				uid: gameUid,
				region: server,
				nickname,
				level,
				serverName
			} );
			
			return {
				uid: gameUid,
				region_time_zone: parseInt( userInfo.region_time_zone ),
				region: server,
				nickname,
				level: level.toString(),
				serverName
			};
		} catch ( e ) {
			return gachaUserInfo;
		}
		
	}
	
	async getUserAvatar( userId: number, _uid: number, server: string, gameType: GameType ): Promise<string> {
		try {
			const { cookie, uid } = await new Account().getAccount( userId );
			const avatar = await getUserFullInfo( cookie, uid );
			// 生成当前用户ID的数据库键
			const currentUidDbKey = generateRedisKey( DB_KEY_CURRENT_ID, {
				qq: userId.toString(),
				prefix: this.config.gameConfig.redisPrefix
			} );
			await bot.redis.setHash( currentUidDbKey, { avatar } );
			return avatar;
			// todo 查游戏头像容易被风控，暂用米游社头像
			// if ( gameType === GameType.GENSHIN ) {
			// 	return await getGenshinUserAvatar( cookie, uid, server );
			// }
			// if ( gameType === GameType.STAR_RAIL ) {
			// 	return await getStarRailUserAvatar( cookie, uid, server );
			// }
			// if ( gameType === GameType.ZZZ ) {
			// 	return await getZzzUserAvatar( cookie, uid, server );
			// }
			// return "";
		} catch ( e ) {
			bot.logger.warn( `[miHoYo抽卡分析] [${ gameType }] 用户 ${ userId }-${ _uid } [获取用户头像]`, e );
			return "";
		}
	}
	
	/**
	 * 计算成就评价
	 * @param achievementData 成就数据
	 * @param totalPulls 总抽数
	 */
	private calculateAchievements( achievementData: AchievementData, totalPulls: number ): string[] {
		const achievements: string[] = [];
		
		// 1. 连续不歪成就
		if ( achievementData.maxConsecutiveNonCrooked >= 2 ) {
			// 统计 歪1 ～ 歪2之间的连续不歪次数，这里由于统计时将歪到的常驻角色后面的UP角色也计入不歪，所以这里要减1
			achievements.push( `${ numberToChinese( achievementData.maxConsecutiveNonCrooked - 1 ) }连不歪` );
		}
		
		// 2. 连续大保底成就
		if ( achievementData.maxConsecutivePity >= 2 ) {
			achievements.push( `${ numberToChinese( achievementData.maxConsecutivePity ) }连大保底` );
		}
		
		// 3. 欧皇时刻和一发入魂
		const hasLuckyMoment = achievementData.allFiveStarPulls.some( pulls => pulls > 10 && pulls <= 30 );
		const hasOnePull = achievementData.allFiveStarPulls.some( pulls => pulls <= 10 );
		
		if ( hasLuckyMoment ) {
			achievements.push( "欧皇时刻" );
		}
		if ( hasOnePull ) {
			achievements.push( "一发入魂" );
		}
		
		// 4. 非酋成就
		const hasUnlucky = achievementData.allFiveStarPulls.some( pulls => pulls >= 80 );
		if ( hasUnlucky ) {
			achievements.push( "非酋竟是我自己" );
		}
		
		// 5. 多黄蛋成就
		const maxFiveStarInTen = Math.max( ...achievementData.tenPullStats.map( stat => stat.fiveStarCount ), 0 );
		if ( maxFiveStarInTen >= 2 ) {
			const items = maxFiveStarInTen === 2 ? "双黄蛋" : `${ numberToChinese( maxFiveStarInTen ) }黄蛋`;
			achievements.push( items );
		}
		
		// 6. A级景区成就
		const maxFourStarInTen = Math.max( ...achievementData.tenPullStats.map( stat => stat.fourStarCount ), 0 );
		if ( maxFourStarInTen >= 2 ) {
			achievements.push( `${ numberToChinese( maxFourStarInTen ) }A级景区` );
		}
		
		// 7. 普通玩家成就（排除法）
		const hasSpecialAchievement = hasOnePull || hasLuckyMoment || hasUnlucky ||
			achievementData.maxConsecutiveNonCrooked >= 2 || achievementData.maxConsecutivePity >= 2 ||
			maxFiveStarInTen >= 2 || maxFourStarInTen >= 2;
		
		const averagePulls = achievementData.allFiveStarPulls.length > 0 ?
			achievementData.allFiveStarPulls.reduce( ( sum, pulls ) => sum + pulls, 0 ) / achievementData.allFiveStarPulls.length : 0;
		
		if ( !hasSpecialAchievement && averagePulls > 30 && averagePulls < 80 && totalPulls > 30 ) {
			achievements.push( "普通玩家" );
		}
		
		return achievements.length > 0 ? achievements : [ "新手上路" ];
	}
	
	/**
	 * 计算十连统计
	 * @param gachaPools 抽卡池数据
	 * @param achievementData 成就数据
	 */
	private calculateTenPullStats( gachaPools: GachaAnalysisPool[], achievementData: AchievementData ): void {
		for ( const pool of gachaPools ) {
			// 按时间排序的物品列表
			const sortedItems = pool.items
				.filter( item => item.id !== this.unknown_id )
				.sort( ( prev, curr ) => this.sortRecords( prev, curr ) );
			
			// 按时间分组，相同时间的为一次十连
			const timeGroups = new Map<string, typeof sortedItems>();
			
			for ( const item of sortedItems ) {
				const timeKey = item.time;
				if ( !timeGroups.has( timeKey ) ) {
					timeGroups.set( timeKey, [] );
				}
				timeGroups.get( timeKey )!.push( item );
			}
			
			// 分析每个时间组（每次十连）
			for ( const [ timeKey, items ] of timeGroups ) {
				// 只统计包含多个物品的组（真正的十连）
				if ( items.length >= 2 ) {
					let fiveStarCount = 0;
					let fourStarCount = 0;
					const pullNumbers: number[] = [];
					
					for ( const item of items ) {
						if ( item.rarity === 5 ) {
							fiveStarCount++;
						} else if ( item.rarity === 4 ) {
							fourStarCount++;
						}
						pullNumbers.push( item.count );
					}
					
					// 只记录有意义的十连（包含5星或2个以上4星）
					if ( fiveStarCount > 0 || fourStarCount >= 2 ) {
						achievementData.tenPullStats.push( {
							fiveStarCount,
							fourStarCount,
							pullNumbers,
							poolType: pool.type
						} );
					}
				}
			}
		}
	}
	
	/**
	 * 按照降序排列，优先比较时间，时间相同则比较ID。
	 * @param prev
	 * @param curr
	 * @return 0,1,-1
	 */
	private sortRecords( prev: GachaAnalysisPoolItem, curr: GachaAnalysisPoolItem ): number {
		const diff = moment( curr.time ).diff( moment( prev.time ) );
		if ( diff > 0 ) {
			return 1;
		} else if ( diff === 0 ) {
			return curr.id!.localeCompare( prev.id! );
		} else {
			return -1;
		}
	}
	
	/**
	 * 获取当前服务器类型的API配置
	 */
	private getApiConfig() {
		const { gameConfig, serverType } = this.config;
		return gameConfig.apiUrls[serverType];
	}
	
	/**
	 * 生成抽卡记录API链接
	 * @param cookie 米游社cookie
	 * @param gameUid 游戏uid
	 * @param server 游戏服务器
	 */
	private async createURL( cookie: string, gameUid: string, server: string ): Promise<GachaURL> {
		const { gameConfig, serverType } = this.config;
		let updatedCookie = false;
		
		if ( !cookie.includes( "stoken" ) ) {
			throw "Cookie 中无 SToken，请使用验证码登录后获取 SToken。";
		}
		
		// 确定game_biz
		const gameBiz = serverType === ServerType.CN ? gameConfig.gameBiz.cn : gameConfig.gameBiz.os;
		
		// 获取authkey
		const { authkey, authkey_ver, sign_type }: AuthKey = await getAuthKey( gameUid, server, gameBiz, cookie );
		
		// 获取抽卡池信息
		let gachaId: string, gachaType: string;
		try {
			const poolInfo: GachaPoolInfo = await updatePoolId( gameConfig, serverType );
			gachaId = poolInfo.gacha_id;
			gachaType = `${ poolInfo.gacha_type }`;
		} catch ( e ) {
			bot.logger.error( e );
			// 使用默认配置
			gachaId = gameConfig.defaultGachaConfig.gachaId;
			gachaType = gameConfig.defaultGachaConfig.gachaType;
		}
		
		const timestamp = Date.now() / 1000 | 0;
		
		// 构建请求参数
		const params = {
			authkey_ver: authkey_ver || "1",
			sign_type: sign_type || "2",
			auth_appid: "webview_gacha",
			init_log_gacha_type: gachaType,
			init_log_gacha_base_type: gachaType[0],
			gacha_id: gachaId,
			gacha_type: gachaType,
			real_gacha_type: gachaType[0],
			timestamp,
			region: server,
			lang: "zh-cn",
			authkey: encodeURIComponent( authkey ),
			game_biz: gameBiz,
			device_type: 'mobile',
			plat_type: "android",
			page: 1,
			size: 5,
			end_id: 0
		};
		
		// 获取API URL
		const apiConfig = this.getApiConfig();
		const apiLogUrl = apiConfig.gacha;
		const logHtmlUrl = apiConfig.html;
		
		// 构建完整URL
		const paramsStr = obj2ParamsStr( params );
		const fullApiUrl = `${ apiLogUrl }?${ paramsStr }`;
		
		// 校验URL
		const response = await fetch( fullApiUrl );
		const data = await response.json();
		
		if ( data.retcode === 0 ) {
			return {
				api_log_url: fullApiUrl,
				log_html_url: `${ logHtmlUrl }?${ paramsStr }#log`,
				cookie: updatedCookie ? cookie : undefined
			};
		} else {
			throw `${ gameConfig.name }抽卡链接生成失败: ${ data.message }`;
		}
	}
	
	/**
	 * 获取抽卡记录数据
	 * @param url 抽卡记录API地址
	 * @param retryTimes 重试次数
	 */
	private async getData( url: string, retryTimes: number = 0 ): Promise<any> {
		const response = await fetch( url );
		const data = await response.json();
		
		// 处理访问频繁错误
		if ( data.retcode === -110 ) {
			if ( retryTimes > 5 ) {
				throw "访问频繁，重试次数达限。";
			}
			await sleep( 5000 );
			return await this.getData( url, retryTimes + 1 );
		}
		
		// 处理AuthKey过期错误
		if ( data.retcode === -101 ) {
			throw "AuthKey 已过期，缓存链接已删除，请重试!";
		}
		
		// 处理其他错误
		if ( data.retcode !== 0 ) {
			const gameName = this.config.gameConfig.name;
			throw data.message ? data.message : `${ gameName }抽卡记录拉取失败，请检查URL！`;
		}
		
		return data;
	}
}