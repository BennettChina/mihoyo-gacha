// Redis 数据库键名常量
export const DB_KEY_CURRENT_ID: string = "$prefix.gacha.curr_uid:$qq";
export const DB_KEY_GACHA_POOL_INFO: string = "$prefix.gacha.pool.info";
export const DB_KEY_GACHA_URL_DEFAULT: string = "$prefix.gacha.api.$qq.1";
export const DB_KEY_GACHA_URL: string = "$prefix.gacha.api.$qq.$sn";
export const DB_KEY_GACHA_HTML_URL: string = "$prefix.gacha.html.$qq.$sn";
export const DB_KEY_GACHA_DATA: string = "$prefix.gacha.data.$uid.$gacha_type";
// 迁移状态
export const DB_KEY_MIGRATION_STATUS: string = "adachi.mihoyo-gacha.migration.status";

// 缓存过期时间常量
export const DB_EXPIRE_24H: number = 24 * 60 * 60;

// 分析指令相关常量
export const DEFAULT_STYLE: string = "1";
export const DEFAULT_SN: string = "1";

// 错误消息常量
export const ERROR_MESSAGES = {
	MISSING_AUTHKEY: "URL中缺少authkey",
	INVALID_URL: "未匹配到可用的URL",
	URL_GENERATION_FAILED: "链接生成失败",
	DATA_LOAD_FAILED: "加载数据失败",
	RENDER_FAILED: "图片渲染失败，请重试。",
	NOT_FOUND_FILE: "未找到引用的文件"
} as const;

// 版本号常量
export const sr_x_rpc_tool_version = "v3.4.0";
export const ys_x_rpc_app_version = "v5.7.2-gr-cn";
export const zzz_x_rpc_app_version = "v2.1.2";