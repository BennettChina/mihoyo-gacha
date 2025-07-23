import { getDeviceFp, getUserAccountInfo } from "#/mihoyo-gacha/api/api";
import { Md5 } from "md5-typescript";
import UserAgent from "user-agents";
import plat from "platform";
import Bot from "ROOT";
import bot from "ROOT";
import { transformCookie } from "#/mihoyo-gacha/util/format";
import { bbs_version } from "#/mihoyo-gacha/util/ds";
import { DeviceData, MiHoYoAccount } from "#/mihoyo-gacha/util/mihoyo";
import { deviceFp, getMiHoYoRandomStr, getMiHoYoUuid, getPlugins, randomEvenNum } from "#/mihoyo-gacha/util/device-fp";
import { Private } from "#/genshin/module/private/main";
import { getPrivateAccount } from "#/genshin/utils/private";

export class Account {
	
	public async getAccount( userId: number, serviceId: string = "1" ): Promise<MiHoYoAccount> {
		const info: Private | string = await getPrivateAccount( userId, serviceId, bot.auth );
		if ( typeof info === "string" ) {
			throw info;
		}
		
		const deviceDBKey = `adachi.miHoYo.${ Md5.init( userId ) }`;
		let dbKey = `adachi.miHoYo.data.`;
		const device = ( await Bot.redis.getHash( deviceDBKey ) as DeviceData );
		if ( device.deviceId ) {
			await getDeviceFp( device.deviceId, device.seedId, device.seedTime, JSON.stringify( this.getExtFields() ), device.deviceFp, "5", "hk4e_cn" );
			const key = `${ dbKey }${ Md5.init( `${ userId }:${ info.setting.mysID }` ) }`;
			const data = await Bot.redis.getHash( key );
			const ck = transformCookie( data.cookie );
			const cookie = transformCookie( {
				...ck,
				deviceId: device.deviceId,
				deviceFp: device.deviceFp,
				seedId: device.seedId,
				seedTime: device.seedTime
			} )
			return {
				uid: parseInt( data.uid ),
				userId: parseInt( data.userId ),
				cookie,
				games: JSON.parse( data.games ),
				deviceData: device
			};
		}
		
		const deviceData = await this.createDevice();
		const headers = {
			"User-Agent": deviceData.userAgent,
			"x-rpc-device_fp": deviceData.deviceFp,
			"x-rpc-device_id": deviceData.deviceId.toUpperCase(),
			'x-rpc-app_version': bbs_version,
		}
		const { list }: { list: any[] } = await getUserAccountInfo( info.setting.mysID, info.setting.cookie, headers );
		if ( !list || list.length === 0 ) {
			throw "未查询到角色数据，请检查米哈游通行证（非UID）是否有误或是否设置角色信息公开";
		}
		
		const games = list.map( item => {
			return {
				gameId: item.game_id,
				gameName: item.game_name,
				uid: item.game_role_id,
				nickname: item.nickname,
				region: item.region,
				level: item.level,
				regionName: item.region_name
			}
		} );
		const ck = transformCookie( info.setting.cookie );
		const cookie = transformCookie( {
			...ck,
			deviceId: deviceData.deviceId,
			deviceFp: deviceData.deviceFp,
			seedId: deviceData.seedId,
			seedTime: deviceData.seedTime
		} )
		return {
			uid: info.setting.mysID,
			userId,
			cookie,
			games,
			deviceData
		};
	}
	
	
	private async createDevice(): Promise<DeviceData> {
		const deviceId = getMiHoYoUuid();
		let device_fp = deviceFp();
		const lifecycleId = getMiHoYoUuid();
		const seedId = getMiHoYoRandomStr( 16 );
		const seedTime = `${ Date.now() }`;
		
		const ext_fields = this.getExtFields();
		const userAgent = ext_fields.userAgent;
		device_fp = await getDeviceFp( deviceId, seedId, seedTime, JSON.stringify( ext_fields ), device_fp, "5", "hk4e_cn" );
		
		return {
			userAgent,
			deviceId,
			deviceFp: device_fp,
			lifecycleId,
			seedId,
			seedTime
		}
	}
	
	private getExtFields() {
		const userAgent = new UserAgent( ( data ) => {
			const os = plat.parse( data.userAgent ).os;
			if ( !os ) return true;
			return os.family === "iOS" && parseInt( os.version || "16", 10 ) >= 16;
		} );
		const { platform, pluginsLength, vendor, viewportWidth, viewportHeight } = userAgent.data;
		
		const plugins = getPlugins( pluginsLength );
		const ratio = `${ randomEvenNum( 2, 8 ) }`;
		const ua = userAgent.toString();
		const idx = ua.indexOf( "(KHTML, like Gecko)" )
		const bbs_ua = `${ ua.slice( 0, idx + 19 ) } miHoYoBBS/${ bbs_version }`;
		return {
			userAgent: bbs_ua,
			browserScreenSize: `${ viewportWidth * viewportHeight }`,
			maxTouchPoints: "5",
			isTouchSupported: "1",
			browserLanguage: "zh-CN",
			browserPlat: platform,
			browserTimeZone: "Asia/Shanghai",
			webGlRender: "Apple GPU",
			webGlVendor: vendor,
			numOfPlugins: plugins.length,
			listOfPlugins: plugins,
			screenRatio: ratio,
			deviceMemory: "unknown",
			hardwareConcurrency: `${ randomEvenNum( 2, 16 ) }`,
			cpuClass: "unknown",
			ifNotTrack: "unknown",
			ifAdBlock: "0",
			hasLiedLanguage: "0",
			hasLiedResolution: "1",
			hasLiedOs: "0",
			hasLiedBrowser: "0",
			canvas: getMiHoYoRandomStr( 64 ),
			webDriver: "0",
			colorDepth: `${ randomEvenNum( 12, 32 ) }`,
			pixelRatio: ratio,
			packageName: "unknown",
			packageVersion: "2.29.0",
			webgl: getMiHoYoRandomStr( 64 )
		};
	}
}