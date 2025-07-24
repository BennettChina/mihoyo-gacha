import { definePlugin } from "@/modules/plugin";
import cfgList from "./commands";
import { Renderer } from "@/modules/renderer";
import { ExportConfig } from "@/modules/config";
import routers from "#/mihoyo-gacha/routes";
import { OSSConfig } from "#/mihoyo-gacha/util/types";
import { getFileSize } from "@/utils/network";
import Progress from "@/utils/progress";
import { formatMemories } from "@/utils/format";
import { MetaManagement } from "#/mihoyo-gacha/module/meta";
import { Logger } from "log4js";
import { GachaHistoryUpItem } from "#/mihoyo-gacha/module/history-up";
import { GameAvatar } from "#/mihoyo-gacha/module/avatar";
import { Migration } from "#/mihoyo-gacha/module/migration";

type Config = {
	tips: string;
	s3: OSSConfig;
	qrcode: boolean;
	migrate: boolean;
	aliases: string[]
}

export let renderer: Renderer;
export let metaManagement: MetaManagement;
export let historyUpItem: GachaHistoryUpItem;
export let gameAvatar: GameAvatar;
const initConfig: Config = {
	tips: "accessKey和secretKey是OSS的两个密钥AK、SK\n" +
		"bucket是你创建的空间名\n" +
		"domain是你OSS的域名（带协议头，如：https://sources.demo.com）\n" +
		"folder是文件上传后的目录，比如:bot/gacha_export\n" +
		"endpoint是你OSS的地区域名\n" +
		"region是OSS所在区域，如：cn-east-1\n",
	s3: {
		enable: false,
		accessKey: '',
		secretKey: '',
		bucket: '',
		domain: '',
		folder: "",
		endpoint: "",
		region: ""
	},
	qrcode: false,
	migrate: false,
	aliases: [ "抽卡分析" ]
};
export let gacha_config: ExportConfig<Config>;

export default definePlugin( {
	name: "miHoYo抽卡分析",
	cfgList,
	server: {
		routers
	},
	assets: {
		manifestUrl: "https://source.hibennett.cn/bot/mihoyo-gacha/manifest.yml",
		downloadBaseUrl: "https://source.hibennett.cn",
		async overflowHandle( assets, pluginKey, { logger, file } ) {
			const gLogger = new Proxy( logger, {
				get( target: Logger, p: string | symbol ): any {
					return ( content: string ) => target[p]( `${ pluginKey } 插件: ${ content }` );
				}
			} );
			gLogger.info( `[${ pluginKey }] 待更新资源数量超出限制，开始下载压缩资源包...` );
			// 超出时下载整包资源
			const fileUrl = "https://source.hibennett.cn/bot/mihoyo-gacha/adachi-assets.zip";
			const totalSize = await getFileSize( fileUrl );
			let downloadSize = 0;
			const progress = new Progress( `下载 ${ pluginKey } 插件整包资源`, totalSize || 0 );
			
			const startTime = Date.now();
			
			// 压缩包下载目标路径
			const zipDownloadPath: string = `${ pluginKey }/adachi-assets.zip`;
			try {
				await file.downloadFileStream( fileUrl, zipDownloadPath, "plugin", chunk => {
					const curLength = chunk.length;
					downloadSize += curLength;
					if ( !totalSize ) {
						progress.setTotal( downloadSize );
					}
					// 下载进度条
					progress.renderer( downloadSize, () => {
						if ( totalSize ) {
							const elapsedTime = ( Date.now() - startTime ) / 1000;
							const averageSize = downloadSize / elapsedTime;
							
							const fDownloadSize = formatMemories( downloadSize, "M" );
							const fTotalSize = formatMemories( totalSize, "M" );
							const fAverageSize = formatMemories( averageSize, averageSize < 1024 * 1024 ? "KB" : "M" );
							return `${ fDownloadSize }/${ fTotalSize } ${ fAverageSize }/s`;
						}
						return formatMemories( downloadSize, "M" );
					} )
				} );
			} catch ( error ) {
				gLogger.error( "资源包下载失败:" + ( <Error>error ).stack );
				throw error;
			}
			// 压缩包解压目标路径
			const zipUnCompressPath = `${ pluginKey }/${ assets.folderName || "adachi-assets" }`;
			/* 此时存在原有资源文件，先进行删除 */
			const { type: originPathFileType } = await file.getFileType( zipUnCompressPath, "plugin" );
			if ( originPathFileType === "directory" ) {
				gLogger.info( "正在清除原有资源文件..." );
				const { status: deleteStatus } = await file.deleteFile( zipUnCompressPath, "plugin" );
				if ( !deleteStatus ) {
					gLogger.error( "清除原有资源文件失败，请尝试手动解压替换" );
					return;
				}
			}
			gLogger.info( "开始解压资源包..." );
			const { status: unCompressStatus } = await file.unCompressFile( "zip", zipDownloadPath, zipUnCompressPath, "plugin" );
			if ( !unCompressStatus ) {
				gLogger.error( "解压资源包失败，请尝试手动解压替换" );
				return;
			}
			gLogger.info( "资源包解压完成" );
			await file.deleteFile( zipDownloadPath, "plugin" );
			return true;
		},
		replacePath: path => path.replace( "bot/mihoyo-gacha", "" )
	},
	publicDirs: [ "assets", "views", "components" ],
	repo: {
		owner: "BennettChina",
		repoName: "mihoyo-gacha",
		ref: "master"
	},
	async mounted( params ) {
		gacha_config = params.configRegister( "main", initConfig );
		params.setAlias( gacha_config.aliases );
		gacha_config.on( 'refresh', newCfg => {
			params.setAlias( newCfg.aliases );
		} )
		metaManagement = new MetaManagement( params.file, params.logger );
		metaManagement.watchStart();
		historyUpItem = new GachaHistoryUpItem();
		gameAvatar = new GameAvatar();
		if ( gacha_config.migrate ) {
			// 迁移数据
			await new Migration( params.redis, params.logger ).migrate();
		}
		renderer = params.renderRegister( "#app", "views" );
		params.logger.info( "[miHoYo抽卡分析] - 初始化完成!" );
	},
	async unmounted( params ) {
		metaManagement.clear();
		await metaManagement.watchClose();
		params.logger.info( "[miHoYo抽卡分析] - 事件监听卸载完成!" );
	}
} )