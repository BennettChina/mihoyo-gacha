import { ConfigType, OrderConfig } from "@/modules/command";

const draw_analysis: OrderConfig = {
	type: "order",
	cmdKey: "miHoYo.gacha.analysis",
	desc: [ "miHoYo抽卡分析", "[原神|星铁|绝区零] (服务序号|抽卡链接)" ],
	headers: [ "分析抽卡" ],
	priority: 99,
	detail: "星铁目前仅支持使用链接直接分析抽卡数据，原神与绝区零支持使用私人服务的Cookie分析抽卡数据。",
	regexps: [ "(原神|星铁|绝区零)", "(\\d+|https?:\\/\\/(?:www\\.)?[-a-zA-Z\\d@:%._+~#=]{1,256}\\.[a-zA-Z\\d()]{1,6}\\b[-a-zA-Z\\d()!@:%_+.~#?&/=]*)?" ],
	ignoreCase: false,
	main: "achieves/universal-analysis"
};

const draw_analysis_history: OrderConfig = {
	type: "order",
	cmdKey: "miHoYo.gacha.analysis.history",
	desc: [ "miHoYo抽卡历史记录分析", "[原神|星铁|绝区零]" ],
	headers: [ "分析记录" ],
	priority: 99,
	regexps: [ "(原神|星铁|绝区零)" ],
	detail: "使用历史数据分析",
	main: "achieves/universal-history"
};

const export_gacha_log: OrderConfig = {
	type: "order",
	cmdKey: "miHoYo.gacha.analysis.export_gacha_log",
	desc: [ "导出miHoYo抽卡记录", "[原神|星铁|绝区零] (json|url) (服务序号)" ],
	headers: [ "导出记录" ],
	priority: 99,
	regexps: [ "(原神|星铁|绝区零)", "(json|url)?", "(\\d+)?" ],
	detail: "导出抽卡记录，目前支持json、url，JSON使用 miHoYoGF 标准，默认导出 UIGF v4.0 格式的 JSON 文件。",
	main: "achieves/universal-export"
};

const import_gacha_log: OrderConfig = {
	type: "order",
	cmdKey: "miHoYo.gacha.analysis.import_gacha_log",
	desc: [ "导入miHoYo抽卡记录", "[原神|星铁|绝区零] [json|excel] (文件下载链接)" ],
	headers: [ "导入记录" ],
	priority: 99,
	regexps: [ "(原神|星铁|绝区零)", "(json|excel)", "(https?:\\/\\/(?:www\\.)?[-a-zA-Z\\d@:%._+~#=]{1,256}\\.[a-zA-Z\\d()]{1,6}\\b[-a-zA-Z\\d()!@:%_+.~#?&/=]*)?" ],
	detail: "导入抽卡记录，目前支持UIGF v4.0 的 json，兼容 excel 和 UIGF v3.0、SRGF v1.0 的 json 格式。",
	ignoreCase: false,
	main: "achieves/universal-import"
};

const del_gacha_log: OrderConfig = {
	type: "order",
	cmdKey: "miHoYo.gacha.analysis.del_gacha_log",
	desc: [ "清除miHoYo抽卡记录", "[原神|星铁|绝区零]" ],
	headers: [ "清除记录" ],
	priority: 99,
	regexps: [ "[原神|星铁|绝区零]" ],
	detail: "删除上次抽卡统计使用的uid，如果要清除其他账号请重新设置链接或者Cookie再使用一次抽卡统计指令即可切换默认账号。(此举是为了验证你是此uid的拥有者，避免误删他人的数据。)",
	main: "achieves/universal-del"
};

export default <ConfigType[]>[
	draw_analysis, draw_analysis_history,
	export_gacha_log, import_gacha_log, del_gacha_log
]