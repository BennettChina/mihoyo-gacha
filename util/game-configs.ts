import { GameConfig, GameType, ServerType } from "./types";

/**
 * 绝区零游戏配置
 */
export const ZZZ_CONFIG: GameConfig = {
	type: GameType.ZZZ,
	name: "绝区零",
	gameId: 8,
	gameBiz: {
		cn: "nap_cn",
		os: "nap_global"
	},
	region: {
		"10": "prod_gf_us", // 美服
		"13": "prod_gf_jp", // 日服
		"15": "prod_gf_eu", // 欧服
		"17": "prod_gf_sg", // 东南亚服
		cn: "prod_gf_cn" // 国服
	},
	apiUrls: {
		cn: {
			gacha: "https://public-operation-nap.mihoyo.com/common/gacha_record/api/getGachaLog",
			html: "https://webstatic.mihoyo.com/nap/event/e20230424gacha/index.html",
			pool: "https://operation-webstatic.mihoyo.com/gacha_info/nap/prod_gf_cn/gacha/list.json",
		},
		os: {
			gacha: "https://public-operation-nap-sg.hoyoverse.com/common/gacha_record/api/getGachaLog",
			html: "",
			pool: ""
		}
	},
	gachaTypes: {
		"2001": "独家频段",
		"3001": "音擎频段",
		"1001": "常驻频段",
		"5001": "邦布频段"
	},
	sortedGachaTypes: [ '2001', '3001', '1001', '5001' ],
	defaultGachaConfig: {
		gachaId: "2c1f5692fdfbb733a08733f9eb69d32aed1d37",
		gachaType: "2001"
	},
	templatePath: "/index.html",
	redisPrefix: "zzz",
	rankType: {
		s: "4",
		a: "3",
		b: "2"
	},
	itemType: {
		character: "代理人",
		weapon: "音擎",
		assistant: "邦布"
	},
	gachaType: {
		character: [ "2001" ],
		weapon: [ "3001" ],
		permanent: "1001",
		beginner: "5001"
	}
};

/**
 * 崩坏：星穹铁道游戏配置
 */
export const STAR_RAIL_CONFIG: GameConfig = {
	type: GameType.STAR_RAIL,
	name: "崩坏：星穹铁道",
	gameId: 6,
	gameBiz: {
		cn: "hkrpg_cn",
		os: "hkrpg_global"
	},
	region: {
		"1": "prod_gf_cn", // 国服
		"2": "prod_gf_cn", // 国服
		"5": "prod_gf_qd", // 渠道服
		"6": "prod_official_usa", // 美服
		"7": "prod_official_euro", // 欧服
		"8": "prod_official_asia", // 亚服
		"9": "prod_official_cht" // 港澳台服
	},
	apiUrls: {
		cn: {
			gacha: "https://public-operation-hkrpg.mihoyo.com/common/gacha_record/api/getGachaLog",
			html: "",
			pool: "https://operation-webstatic.mihoyo.com/gacha_info/hkrpg/prod_gf_cn/gacha/list.json",
		},
		os: {
			gacha: "https://public-operation-hkrpg-sg.hoyoverse.mihoyo.com/common/gacha_record/api/getGachaLog",
			html: "",
			pool: "https://operation-webstatic.mihoyo.com/gacha_info/hkrpg/prod_gf_cn/gacha/list.json",
		}
	},
	gachaTypes: {
		"11": "角色活动跃迁",
		"12": "光锥活动跃迁",
		"21": "联动角色UP池",
		"22": "联动光锥UP池",
		"1": "群星跃迁",
		"2": "始发跃迁"
	},
	sortedGachaTypes: [ '11', '12', '21', '22', '1', '2' ],
	defaultGachaConfig: {
		gachaId: "dbebc8d9fbb0d4ffa067423482ce505bc5ea",
		gachaType: "11"
	},
	templatePath: "/index.html",
	redisPrefix: "sr",
	rankType: {
		s: "5",
		a: "4",
		b: "3"
	},
	itemType: {
		character: "角色",
		weapon: "光锥"
	},
	gachaType: {
		character: [ "11", "21" ],
		weapon: [ "12", "22" ],
		permanent: "1",
		beginner: "2"
	}
};

/**
 * 原神游戏配置
 */
export const GENSHIN_CONFIG: GameConfig = {
	type: GameType.GENSHIN,
	name: "原神",
	gameId: 2,
	gameBiz: {
		cn: "hk4e_cn",
		os: "hk4e_global"
	},
	region: {
		"1": "cn_gf01",
		"2": "cn_gf01",
		"3": "cn_gf01",
		"4": "cn_gf01",
		"5": "cn_qd01",
		"6": "os_usa",
		"7": "os_euro",
		"8": "os_asia",
		"18": "os_asia",
		"9": "os_cht"
	},
	apiUrls: {
		cn: {
			gacha: "https://public-operation-hk4e.mihoyo.com/gacha_info/api/getGachaLog",
			html: "https://webstatic.mihoyo.com/hk4e/event/e20190909gacha-v3/index.html",
			pool: "https://operation-webstatic.mihoyo.com/gacha_info/hk4e/cn_gf01/gacha/list.json",
		},
		os: {
			gacha: "https://public-operation-hk4e-sg.hoyoverse.com/gacha_info/api/getGachaLog",
			html: "https://webstatic-sea.mihoyo.com/hk4e/event/e20200929gacha-v3/index.html",
			pool: ""
		}
	},
	gachaTypes: {
		"301": "角色活动祈愿",
		"302": "武器活动祈愿",
		"200": "常驻祈愿",
		"100": "新手祈愿",
		"500": "集录祈愿"
	},
	sortedGachaTypes: [ '301', '302', '500', '200', '100' ],
	defaultGachaConfig: {
		gachaId: "fecafa7b6560db5f3182222395d88aaa6aaac1bc",
		gachaType: "301"
	},
	templatePath: "/index.html",
	redisPrefix: "genshin",
	rankType: {
		s: "5",
		a: "4",
		b: "3"
	},
	itemType: {
		character: "角色",
		weapon: "武器"
	},
	gachaType: {
		character: [ "301", "400" ],
		weapon: [ "302" ],
		permanent: "200",
		beginner: "100",
		special: [ "500" ]
	}
};

/**
 * 游戏配置映射表
 */
export const GAME_CONFIGS: Record<GameType, GameConfig> = {
	[GameType.ZZZ]: ZZZ_CONFIG,
	[GameType.STAR_RAIL]: STAR_RAIL_CONFIG,
	[GameType.GENSHIN]: GENSHIN_CONFIG
};

/**
 * 根据游戏ID获取游戏配置
 * @param gameId 游戏ID
 * @returns 游戏配置或undefined
 */
export function getGameConfigByGameId( gameId: number ): GameConfig | undefined {
	return Object.values( GAME_CONFIGS ).find( config => config.gameId === gameId );
}

/**
 * 根据游戏类型获取游戏配置
 * @param gameType 游戏类型
 * @returns 游戏配置或undefined
 */
export function getGameConfig( gameType: GameType ): GameConfig | undefined {
	return GAME_CONFIGS[gameType];
}

/**
 * 根据game_biz获取游戏配置
 * @param gameBiz 游戏业务标识
 * @returns 游戏配置和服务器类型
 */
export function getGameConfigByGameBiz( gameBiz: string ): { config: GameConfig; serverType: 'cn' | 'os' } | undefined {
	for ( const config of Object.values( GAME_CONFIGS ) ) {
		if ( config.gameBiz.cn === gameBiz ) {
			return { config, serverType: 'cn' };
		}
		if ( config.gameBiz.os === gameBiz ) {
			return { config, serverType: 'os' };
		}
	}
	return undefined;
}

/**
 * 根据服务器区域获取服务器类型
 * @param region 服务器区域
 * @returns 服务器类型
 */
export function getServerType( region: string ): ServerType {
	const keywords = [ "gf", "cn", "qd" ];
	if ( keywords.some( keyword => region.includes( keyword ) ) ) {
		return ServerType.CN;
	}
	return ServerType.OS;
}

/**
 * 解析游戏类型字符串
 * @param gameTypeStr 游戏类型字符串
 * @returns 游戏类型枚举
 */
export function parseGameType( gameTypeStr: string ): GameType {
	switch ( gameTypeStr ) {
		case "绝区零":
			return GameType.ZZZ;
		case "星铁":
			return GameType.STAR_RAIL;
		default:
			return GameType.GENSHIN;
	}
}
