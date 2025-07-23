export interface AuthKey {
	sign_type: number;
	authkey_ver: number;
	authkey: string;
}

export interface GachaPoolInfo {
	begin_time: string;
	end_time: string;
	gacha_id: string;
	gacha_name: string;
	gacha_type: number;
}

export interface Gacha_Info {
	uid: string;
	gacha_id: string;
	gacha_type: string;
	item_id: string;
	count: string;
	time: string;
	name: string;
	lang: string;
	item_type: string;
	rank_type: string;
	id: string;
}

// ==================== UIGF v4.0 标准接口 ====================

/**
 * UIGF v4.0 标准根接口
 */
export interface UIGF_v4 {
	info: UIGF_v4_Info;
	hk4e?: UIGF_v4_Genshin_Account[];
	hkrpg?: UIGF_v4_StarRail_Account[];
	nap?: UIGF_v4_ZZZ_Account[];
}

/**
 * UIGF v4.0 信息接口
 */
export interface UIGF_v4_Info {
	export_timestamp: string | number;
	export_app: string;
	export_app_version: string;
	version: string; // 格式为 'v4.0'
}

/**
 * UIGF v4.0 原神账号数据
 */
export interface UIGF_v4_Genshin_Account {
	uid: string | number;
	timezone: number;
	lang?: string;
	list: UIGF_v4_Genshin_Item[];
}

/**
 * UIGF v4.0 原神抽卡记录
 */
export interface UIGF_v4_Genshin_Item {
	uigf_gacha_type: string;
	gacha_type: string;
	item_id: string;
	count?: string;
	time: string;
	name?: string;
	item_type?: string;
	rank_type?: string;
	id: string;
}

/**
 * UIGF v4.0 星铁账号数据
 */
export interface UIGF_v4_StarRail_Account {
	uid: string | number;
	timezone: number;
	lang?: string;
	list: UIGF_v4_StarRail_Item[];
}

/**
 * UIGF v4.0 星铁抽卡记录
 */
export interface UIGF_v4_StarRail_Item {
	gacha_type: string;
	gacha_id: string;
	item_id: string;
	count?: string;
	time: string;
	name?: string;
	item_type?: string;
	rank_type?: string;
	id: string;
}

/**
 * UIGF v4.0 绝区零账号数据
 */
export interface UIGF_v4_ZZZ_Account {
	uid: string | number;
	timezone: number;
	lang?: string;
	list: UIGF_v4_ZZZ_Item[];
}

/**
 * UIGF v4.0 绝区零抽卡记录
 */
export interface UIGF_v4_ZZZ_Item {
	gacha_type: string;
	gacha_id?: string;
	item_id: string;
	count?: string;
	time: string;
	name?: string;
	item_type?: string;
	rank_type?: string;
	id: string;
}

// ==================== 向下兼容的旧版本接口 ====================

/**
 * @deprecated 使用 UIGF_v4 替代
 * 旧版本标准抽卡数据格式（保持向下兼容）
 */
export interface Standard_Gacha {
	info: Standard_Gacha_Info;
	list: Standard_Gacha_Data[];
}

/**
 * @deprecated 使用 UIGF_v4_Info 替代
 * 旧版本抽卡信息接口
 */
export interface Standard_Gacha_Info {
	uid: string;
	lang: string;
	region_time_zone: number;
	export_timestamp: number;
	export_app: string;
	export_app_version: string;
	srgf_version: string;
}

/**
 * @deprecated 使用对应游戏的 UIGF_v4_*_Item 替代
 * 旧版本抽卡数据接口
 */
export interface Standard_Gacha_Data {
	id: string;
	name: string;
	gacha_id: string;
	gacha_type: string;
	item_id: string;
	item_type: string;
	rank_type: string;
	count: string;
	time: string;
}

export interface GachaUserInfo {
	uid: string;
	region: string;
	region_time_zone: number;
	nickname?: string;
	level?: string;
	serverName?: string;
	avatar?: string;
}

export interface Standard_Gacha_Excel_Origin_Data {
	count: string;
	gacha_id: string;
	gacha_type: string;
	id: string;
	item_id: string;
	item_type: string;
	lang: string;
	name: string;
	rank_type: string;
	time: string;
	uid: string;
}

export interface FakeIdFunc {
	(): string;
}

export interface Standard_Gacha_Excel {
	time: string;
	name: string;
	item_type: string;
	rank_type: string;
	gacha_type: string;
}

export interface OSSConfig {
	enable: boolean;
	accessKey: string;
	secretKey: string;
	bucket: string;
	// 带协议头
	domain: string;
	// 上传后的目录
	folder: string;
	endpoint: string;
	region: string;
}

/**
 * @api_log_url 接口地址
 * @log_html_url 网页地址（抽卡分析通用URL）
 */
export interface GachaURL {
	api_log_url: string;
	log_html_url: string;
	cookie?: string;
}

/**
 * UIGF 的 md5 校验接口响应
 */
export interface UIGF_Md5 {
	chs: string;
	cht: string;
	de: string;
	en: string;
	es: string;
	fr: string;
	id: string;
	jp: string;
	kr: string;
	pt: string;
	ru: string;
	th: string;
	vi: string;
	all: string;
}

/**
 * 分析指令解析结果
 */
export interface AnalysisParams {
	sn: string;
	style: string;
}

/**
 * URL 解析结果
 */
export interface ParsedURL {
	url: string;
	searchParams: URLSearchParams;
	search: string;
}

/**
 * 错误处理结果
 */
export interface ErrorResult {
	success: false;
	error: string;
}

/**
 * 成功处理结果
 */
export interface SuccessResult<T = any> {
	success: true;
	data: T;
}

/**
 * 通用处理结果
 */
export type ProcessResult<T = any> = ErrorResult | SuccessResult<T>;

/**
 * 支持的游戏类型枚举
 */
export enum GameType {
	ZZZ = "zzz",
	STAR_RAIL = "sr",
	GENSHIN = "genshin"
}

/**
 * 服务器类型枚举
 */
export enum ServerType {
	CN = "cn",
	OS = "os"
}

/**
 * 游戏配置接口
 */
export interface GameConfig {
	/** 游戏类型 */
	type: GameType;
	/** 游戏名称 */
	name: string;
	/** 游戏ID（米游社中的标识） */
	gameId: number;
	/** 游戏业务标识 */
	gameBiz: {
		cn: string;
		os: string;
	};
	region: Record<string, string>;
	/** API地址配置 */
	apiUrls: {
		cn: {
			gacha: string;
			html: string;
			pool: string;
		};
		os: {
			gacha: string;
			html: string;
			pool: string;
		};
	};
	/** 抽卡类型定义 */
	gachaTypes: Record<string, string>;
	sortedGachaTypes: string[];
	/** 默认抽卡池配置 */
	defaultGachaConfig: {
		gachaId: string;
		gachaType: string;
	};
	/** 渲染模板路径 */
	templatePath: string;
	/** Redis键名前缀 */
	redisPrefix: string;
	rankType: {
		s: string;
		a: string;
		b: string;
	};
	itemType: {
		character: string; // 角色
		weapon: string; // 武器
		assistant?: string; // 辅助角色
	},
	gachaType: {
		character: string[]; // 角色池
		weapon: string[]; // 武器池
		permanent: string; // 常驻池
		beginner: string; // 新手池
		special?: string[]; // 特殊池
	}
}

/**
 * 游戏客户端配置
 */
export interface ClientConfig {
	/** 当前游戏配置 */
	gameConfig: GameConfig;
	/** 服务器类型 */
	serverType: ServerType;
	/** 是否启用调试模式 */
	debug?: boolean;
}

/**
 * 抽卡分析数据
 */
export interface AnalysisData {
	achievement: string[]; // 成就评价
	totalPulls: number; // 总抽数
	upCharacterCount: number; // UP角色个数
	upCharacterPulls: number; // UP角色池总抽数
	upWeaponCount: number; // UP武器个数
	upWeaponPulls: number; // UP武器池总抽数
	upCharacterAverage: number; // 平均每UP角色需要的抽数
	upCharacterRate: string; // UP角色概率
	permanentAverage: number; // 常驻平均出货数
	aRankCount: number; // 4星角色数
	aRankAverage: number; // 4星平均出货数
	upWeaponAverage: number; // UP武器平均出货数
	upWeaponRate: string; // UP武器概率
	favorite: string; // 最钟爱你的 TA
	favoriteCount: number; // 最钟爱你的 TA 的抽卡数
}

export type GachaAnalysisPoolItem = {
	id: string; // 抽卡记录ID
	time: string; // 抽卡时间
	name: string; // 名称
	image: string; // 图片地址
	count: number; // 抽卡数
	isCrooked: boolean; // 是否歪了
	rarity: number; // 稀有度
};

/**
 * 抽卡分析池数据
 */
export interface GachaAnalysisPool {
	name: string; // 卡池名称
	type: string; // 卡池类型
	count: number; // 抽卡数
	items: GachaAnalysisPoolItem[];
}

/**
 * 抽卡分析图表数据
 */
export interface GachaAnalysisChartData {
	type: string;
	title: string;
	data: {
		label: string;
		value: number;
		extra?: any;
	}[];
}

/**
 * 抽卡分析结果
 */
export interface GachaAnalysisResult {
	analysisData: AnalysisData;
	gachaPools: GachaAnalysisPool[];
	chartData: GachaAnalysisChartData;
}

/**
 * 抽卡数据
 */
export interface GachaData {
	key: string; // 抽卡类型
	name: string; // 抽卡类型名称
	data: Gacha_Info[]; // 抽卡数据
}

/**
 * UP的角色/武器信息
 */
export interface GachaUpItem {
	version: string; // 版本号
	pool_name: string; // 卡池名称
	type: 'character' | 'weapon'; // 类型
	rarity: number; // 稀有度
	name: string; // 名称
	begin_time: string; // 开始时间
	end_time: string; // 结束时间
}


/**
 * 角色/武器/邦布头像
 */
export interface Avatar {
	item_id: string;
	item_name: string;
	item_icon: string;
}