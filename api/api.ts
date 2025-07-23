import axios, { AxiosError } from "axios";
import { generateDS, generateRedisKey } from "#/mihoyo-gacha/util/util";
import { AuthKey, GachaPoolInfo, GameConfig, ServerType } from "#/mihoyo-gacha/util/types";
import bot from "ROOT";
import {
	DB_KEY_GACHA_POOL_INFO,
	sr_x_rpc_tool_version,
	ys_x_rpc_app_version,
	zzz_x_rpc_app_version
} from "#/mihoyo-gacha/util/constants";
import { guid } from "#/mihoyo-gacha/util/guid";
import { transformCookie } from "#/mihoyo-gacha/util/format";
import { bbs_version, ds, ds3 } from "#/mihoyo-gacha/util/ds";
import { getRandomString } from "@/utils/random";
import { ds2 } from "#/mihoyo-job/utils/ds";

const API = {
	AUTH_KEY: "https://api-takumi.mihoyo.com/binding/api/genAuthKey",
	POOL: "https://operation-webstatic.mihoyo.com/gacha_info/nap/prod_gf_cn/gacha/list.json",
	USER_GAME_ROLE: "https://api-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie",
	GENSHIN_INDEX: "https://api-takumi-record.mihoyo.com/game_record/app/genshin/api/index",
	STAR_RAIL_INDEX: "https://api-takumi-record.mihoyo.com/game_record/app/hkrpg/api/index",
	ZZZ_INDEX: "https://api-takumi-record.mihoyo.com/event/game_record_zzz/api/zzz/index",
	ROLE_ID: "https://api-takumi-record.mihoyo.com/game_record/app/card/wapi/getGameRecordCard",
	GET_DEVICE_FP: "https://public-data-api.mihoyo.com/device-fp/api/getFp",
	GET_USER_FULL_INFO: "https://bbs-api.miyoushe.com/user/api/getUserFullInfo"
}

const headers = (): Record<string, string> => ( {
	"cookie": "",
	"ds": "",
	"host": "api-takumi.mihoyo.com",
	"referer": "https://app.mihoyo.com",
	"user-agent": "okhttp/4.8.0",
	"x-rpc-app_version": "2.71.1",
	"x-rpc-channel": "mihoyo",
	"x-rpc-client_type": "2",
	"x-rpc-device_id": guid(),
	"x-rpc-device_model": "SM-977N",
	"x-rpc-device_name": "Samsung SM-G977N",
	"x-rpc-sys_version": "12",
} );

const webstatic_headers = (): Record<string, string> => ( {
	"User-Agent": `Mozilla/5.0 (Linux; Android 11; J9110 Build/55.2.A.4.332; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.179 Mobile Safari/537.36 miHoYoBBS/${ bbs_version }`,
	"Referer": "https://webstatic.mihoyo.com/",
	"Origin": "https://webstatic.mihoyo.com",
	"x-rpc-device_id": "",
} );

const act_headers = (): Record<string, string> => ( {
	"User-Agent": `Mozilla/5.0 (Linux; Android 11; J9110 Build/55.2.A.4.332; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.179 Mobile Safari/537.36 miHoYoBBS/${ bbs_version }`,
	"Referer": "https://act.mihoyo.com/",
	"Origin": "https://act.mihoyo.com",
	"x-rpc-device_id": "",
} );

export async function getAuthKey( uid: string, server: string, gameBiz: string, cookie: string ): Promise<AuthKey> {
	const data = {
		auth_appid: "webview_gacha",
		game_biz: gameBiz,
		game_uid: uid,
		region: server
	};
	const { data: { retcode, message, data: _data } } = await axios.post( API.AUTH_KEY, data, {
		headers: {
			...headers(),
			"ds": generateDS(),
			"cookie": cookie
		},
		timeout: 5000
	} ).catch( reason => {
		if ( axios.isAxiosError( reason ) ) {
			let err = <AxiosError>reason;
			return Promise.reject( `生成authKey失败, reason: ${ err.message }` )
		} else {
			return Promise.reject( reason );
		}
	} );
	if ( retcode === 10001 ) {
		return Promise.reject( "请更换Cookie" );
	}
	if ( retcode !== 0 ) {
		return Promise.reject( "米游社接口报错: " + message );
	}
	
	return _data
}

export async function updatePoolId( gameConfig: GameConfig, serverType: ServerType ): Promise<GachaPoolInfo> {
	const dbKey = generateRedisKey( DB_KEY_GACHA_POOL_INFO, {
		prefix: gameConfig.redisPrefix
	} );
	const gacha_pool_info: string = await bot.redis.getString( dbKey );
	if ( gacha_pool_info ) {
		return Promise.resolve( JSON.parse( gacha_pool_info ) );
	}
	
	try {
		const {
			data: {
				retcode,
				message,
				data
			}
		} = await axios.get( gameConfig.apiUrls[serverType].pool, { timeout: 5000 } );
		if ( retcode !== 0 ) {
			return Promise.reject( "米游社接口报错: " + message );
		}
		const result = data.list[0];
		await bot.redis.setString( dbKey, JSON.stringify( result ), 60 * 60 * 24 * 30 );
		return result;
	} catch ( err ) {
		if ( axios.isAxiosError( err ) ) {
			return Promise.reject( `获取池子信息失败, reason: ${ err.message }` );
		}
		
		return Promise.reject( err );
	}
}

export async function getDeviceFp( device_id: string, seed_id: string, seed_time: string, ext_fields: string, device_fp: string, platform: string = "4", app_name: string = "bbs_cn" ): Promise<string> {
	const response = await axios.post( API.GET_DEVICE_FP, {
		seed_id,
		device_id,
		platform,
		seed_time,
		ext_fields,
		app_name,
		device_fp
	} ).catch( ( reason: AxiosError ) => {
		throw new Error( reason.message );
	} );
	
	const data = response.data;
	if ( data.retcode !== 0 ) {
		return Promise.reject( data.message );
	}
	
	if ( data.data.code !== 200 ) {
		return Promise.reject( data.data.msg );
	}
	
	return data.data.device_fp;
}

export async function getUserAccountInfo( uid: number, cookie: string, headers: Record<string, string | number> ) {
	const params = { uid };
	const { stoken, stuid, mid, login_ticket } = transformCookie( cookie );
	cookie = transformCookie( { stuid, stoken, mid, login_ticket } );
	const { data: response } = await axios.get( API.ROLE_ID, {
		params,
		headers: {
			...headers,
			"Referer": "https://webstatic.mihoyo.com",
			"Origin": 'https://webstatic.mihoyo.com',
			"X_Requested_With": 'com.mihoyo.hyperion',
			"x-rpc-client_type": "2",
			"x-rpc-app_id": "bll8iq97cem8",
			"Cookie": cookie,
			"DS": ds( "bbs" ),
		}
	} ).catch( ( reason: AxiosError ) => {
		throw new Error( reason.message );
	} );
	
	if ( response.data.retcode === 1034 ) {
		throw new Error( "[查询账户信息] 遇到风控需要人机验证" );
	}
	
	if ( response.data.retcode !== 0 ) {
		return Promise.reject( `[查询账户信息] ${ response.data.message }` );
	}
	return response;
}

export async function getGenshinUserAvatar( cookie: string, uid: string | number, server: string ): Promise<string> {
	const {
		cookie_token,
		ltoken,
		ltuid,
		deviceId,
		deviceFp,
		seedId,
		seedTime,
		login_ticket
	} = transformCookie( cookie );
	cookie = transformCookie( {
		account_id: ltuid,
		cookie_token,
		ltoken,
		ltuid,
		login_ticket,
		DEVICEFP: deviceFp,
		_MHYUUID: deviceId,
		DEVICEFP_SEED_ID: seedId,
		DEVICEFP_SEED_TIME: seedTime
	} )
	const params = {
		avatar_list_type: 1,
		server,
		role_id: uid,
	};
	const { data: { retcode, message, data } } = await axios.get( API.GENSHIN_INDEX, {
		headers: {
			...webstatic_headers,
			"x-rpc-device_id": deviceId.toUpperCase(),
			"x-rpc-device_fp": deviceFp,
			'x-rpc-device_name': 'iPhone',
			'x-rpc-app_version': bbs_version,
			"x-rpc-client_type": "5",
			"x-rpc-sys_version": "16.7.10",
			"x-rpc-tool_verison": ys_x_rpc_app_version,
			'x-rpc-page': `${ ys_x_rpc_app_version }_#/ys`,
			"DS": ds3( 'game', undefined, params ),
			"Cookie": cookie
		},
		params,
		timeout: 5000
	} ).catch( reason => {
		return Promise.reject( reason.message );
	} );
	if ( retcode === 10001 ) {
		return Promise.reject( "请更换Cookie" );
	}
	if ( retcode === 1034 || retcode === 10035 ) {
		return Promise.reject( "遇到风控需要人机验证" );
	}
	if ( retcode !== 0 ) {
		return Promise.reject( "米游社接口报错: " + message );
	}
	
	return data?.role?.game_head_icon || "";
}

export async function getStarRailUserAvatar( cookie: string, uid: string | number, server: string ): Promise<string> {
	const {
		cookie_token,
		ltoken,
		ltuid,
		deviceId,
		deviceFp,
		seedId,
		seedTime,
		login_ticket
	} = transformCookie( cookie );
	cookie = transformCookie( {
		account_id: ltuid,
		cookie_token,
		ltoken,
		ltuid,
		login_ticket,
		DEVICEFP: deviceFp,
		_MHYUUID: deviceId,
		DEVICEFP_SEED_ID: seedId,
		DEVICEFP_SEED_TIME: seedTime
	} )
	const params = {
		server,
		role_id: uid
	};
	const { data: { retcode, message, data } } = await axios.get( API.STAR_RAIL_INDEX, {
		headers: {
			...webstatic_headers,
			"x-rpc-device_id": deviceId.toUpperCase(),
			"x-rpc-device_fp": deviceFp,
			'x-rpc-device_name': 'iPhone',
			'x-rpc-app_version': bbs_version,
			"x-rpc-client_type": "5",
			'x-rpc-platform': '5',
			"x-rpc-sys_version": "16.7.10",
			"x-rpc-tool_verison": sr_x_rpc_tool_version,
			'x-rpc-page': `${ sr_x_rpc_tool_version }_#/rpg`,
			"DS": ds3( 'game', undefined, params ),
			"Cookie": cookie
		},
		params,
		timeout: 5000
	} ).catch( reason => {
		return Promise.reject( reason.message );
	} );
	if ( retcode === 10001 ) {
		return Promise.reject( "请更换Cookie" );
	}
	if ( retcode === 1034 || retcode === 10035 ) {
		return Promise.reject( "遇到风控需要人机验证" );
	}
	if ( retcode !== 0 ) {
		return Promise.reject( "米游社接口报错: " + message );
	}
	
	return data?.cur_head_icon_url || "";
}

export async function getZzzUserAvatar( cookie: string, uid: string | number, server: string ): Promise<string> {
	const {
		cookie_token,
		ltoken,
		ltuid,
		deviceId,
		deviceFp,
		seedId,
		seedTime,
		login_ticket
	} = transformCookie( cookie );
	cookie = transformCookie( {
		account_id: ltuid,
		cookie_token,
		ltoken,
		ltuid,
		login_ticket,
		DEVICEFP: deviceFp,
		_MHYUUID: deviceId,
		DEVICEFP_SEED_ID: seedId,
		DEVICEFP_SEED_TIME: seedTime,
		mi18nLang: "zh-cn"
	} )
	const params = {
		server,
		role_id: uid
	};
	const { data: { retcode, message, data } } = await axios.get( API.ZZZ_INDEX, {
		headers: {
			...act_headers(),
			"x-rpc-device_id": deviceId.toUpperCase(),
			"x-rpc-device_fp": deviceFp,
			'x-rpc-device_name': 'iPhone',
			'x-rpc-app_version': bbs_version,
			"x-rpc-client_type": "5",
			'x-rpc-platform': '1',
			'x-rpc-geetest_ext': `{"viewUid":"0","server":"${ server }","gameId":8,"page":"${ zzz_x_rpc_app_version }_#/zzz","isHost":1,"viewSource":3,"actionSource":127}`,
			'x-rpc-lang': 'zh-cn',
			'x-rpc-lrsag': '',
			"x-rpc-sys_version": "16.7.10",
			"x-rpc-tool_verison": zzz_x_rpc_app_version,
			'x-rpc-page': `${ zzz_x_rpc_app_version }_#/zzz`,
			"DS": ds3( 'game', undefined, params ),
			"Cookie": cookie
		},
		params,
		timeout: 5000
	} ).catch( reason => {
		return Promise.reject( reason.message );
	} );
	if ( retcode === 10001 ) {
		return Promise.reject( "请更换Cookie" );
	}
	if ( retcode === 1034 || retcode === 10035 ) {
		return Promise.reject( "遇到风控需要人机验证" );
	}
	if ( retcode !== 0 ) {
		return Promise.reject( "米游社接口报错: " + message );
	}
	
	return data?.cur_head_icon_url || "";
}

export async function getUserFullInfo( cookie: string, uid: string | number ): Promise<string> {
	const { stoken, stuid, mid, login_ticket, deviceId, deviceFp } = transformCookie( cookie );
	cookie = transformCookie( { stuid, stoken, mid, login_ticket } );
	const params = {
		uid
	}
	const response = await axios.get( API.GET_USER_FULL_INFO, {
		headers: {
			'User-Agent': "Hyperion/473 CFNetwork/1410.1 Darwin/22.6.0",
			"Referer": "https://app.mihoyo.com",
			"x-rpc-device_id": deviceId,
			"x-rpc-device_fp": deviceFp,
			'x-rpc-device_name': 'iPhone',
			'x-rpc-csm_source': 'myself',
			'x-rpc-channel': 'appstore',
			'x-rpc-device_model': 'iPhone10,3',
			'x-rum-tracestate': 'app_id=484533,origin=rum',
			'x-rpc-app_version': bbs_version,
			"x-rpc-client_type": "1",
			"x-rpc-sys_version": "16.7.10",
			'x-rpc-verify_key': "bll8iq97cem8",
			'x-rpc-h265_supported': '1',
			'x-rum-traceparent': `00-${ getRandomString( 32 ).toLowerCase() }-${ getRandomString( 16 ).toLowerCase() }-01`,
			"DS": ds2( 'lk2', undefined, params ),
			"Cookie": cookie
		},
		params
	} ).catch( ( reason: AxiosError ) => {
		throw new Error( reason.message );
	} );
	
	if ( response.data.retcode === 1034 || response.data.retcode === 10035 ) {
		throw new Error( "[获取用户信息] 遇到风控需要人机验证" );
	}
	
	if ( response.data.retcode !== 0 ) {
		return Promise.reject( `[获取用户信息] ${ response.data.message }` );
	}
	const userInfo = response.data.data.user_info;
	const avatar = userInfo?.avatar_url;
	// 优先取 webp 格式的头像
	return userInfo.avatar_ext.resources.find( el => el.format === 1 )?.url || avatar;
}