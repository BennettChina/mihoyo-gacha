/**
 * 工具函数库
 * 提供数据处理、验证、格式化等功能
 */

/**
 * 从URL参数获取游戏类型
 * @returns {string|null} 游戏类型
 */
export function getGameTypeFromURL() {
	const params = new URLSearchParams( window.location.search );
	const gameType = params.get( 'game' );
	
	if ( [ 'zzz', 'sr', 'genshin' ].includes( gameType ) ) {
		return gameType;
	}
	
	return 'genshin'; // 默认返回原神
}

/**
 * 获取URL参数
 * @returns {Object} URL参数对象
 */
export function getURLParams() {
	const params = new URLSearchParams( window.location.search );
	return {
		qq: params.get( 'qq' ),
		game: params.get( 'game' ) || 'genshin',
		style: params.get( 'style' ) || '1'
	};
}

/**
 * 设置页面标题
 * @param {string} gameType 游戏类型
 */
export function setPageTitle( gameType ) {
	const gameNames = {
		zzz: '绝区零',
		sr: '崩坏：星穹铁道',
		genshin: '原神'
	};
	
	document.title = `${ gameNames[gameType] }抽卡分析 - Adachi-BOT`;
}

/**
 * 格式化抽卡数据
 * @param {Object} rawData 原始数据
 * @param {string} gameType 游戏类型
 * @returns {Object} 格式化后的数据
 */
export function formatGachaData( rawData, gameType ) {
	if ( !rawData ) {
		return null;
	}
	
	return {
		userInfo: {
			name: rawData.user?.name || '未知用户',
			level: rawData.user?.level || 1,
			server: rawData.user?.server || '未知服务器',
			uid: rawData.user?.uid || '000000000',
			avatar: rawData.user?.avatar || 'https://via.placeholder.com/72x72/4A90E2/ffffff?text=头像'
		},
		analysisData: {
			totalPulls: rawData.analysis?.totalPulls || 0,
			upCharacterCount: rawData.analysis?.upCharacterCount || 0,
			upCharacterAverage: rawData.analysis?.upCharacterAverage || 0,
			upCharacterRate: rawData.analysis?.upCharacterRate || '0%',
			permanentCount: rawData.analysis?.permanentCount || 0,
			permanentAverage: rawData.analysis?.permanentAverage || 0,
			aRankCount: rawData.analysis?.aRankCount || 0,
			aRankAverage: rawData.analysis?.aRankAverage || 0,
			upWeaponAverage: rawData.analysis?.upWeaponAverage,
			achievement: rawData.analysis?.achievement || '普通'
		},
		gachaPools: rawData.pools?.map( pool => ( {
			name: pool.name,
			type: pool.type,
			items: pool.items?.map( item => ( {
				name: item.name,
				image: item.image,
				count: item.count,
				isCrooked: item.isCrooked,
				rarity: item.rarity || 4
			} ) ) || []
		} ) ) || [],
		chartData: {
			type: rawData.chart?.type || 'pie',
			title: rawData.chart?.title,
			data: rawData.chart?.data?.map( item => ( {
				label: item.label || item.name,
				value: item.value || item.count,
				extra: item.extra
			} ) ) || []
		},
		gameType
	};
}

/**
 * 验证抽卡数据
 * @param {Object} data 抽卡数据
 * @returns {Object} 验证结果
 */
export function validateGachaData( data ) {
	const errors = [];
	
	if ( !data ) {
		errors.push( '数据不能为空' );
		return { valid: false, errors };
	}
	
	// 验证用户信息
	if ( !data.userInfo ) {
		errors.push( '缺少用户信息' );
	} else {
		if ( !data.userInfo.uid ) {
			errors.push( '缺少用户UID' );
		}
		if ( !data.userInfo.name ) {
			errors.push( '缺少用户名称' );
		}
	}
	
	// 验证分析数据
	if ( !data.analysisData ) {
		errors.push( '缺少分析数据' );
	} else {
		if ( typeof data.analysisData.totalPulls !== 'number' ) {
			errors.push( '总抽数必须是数字' );
		}
		if ( typeof data.analysisData.upCharacterCount !== 'number' ) {
			errors.push( 'UP角色次数必须是数字' );
		}
	}
	
	// 验证抽卡池数据
	if ( !Array.isArray( data.gachaPools ) ) {
		errors.push( '抽卡池数据必须是数组' );
	}
	
	// 验证游戏类型
	if ( !data.gameType ) {
		errors.push( '缺少游戏类型' );
	} else if ( ![ 'zzz', 'sr', 'genshin' ].includes( data.gameType ) ) {
		errors.push( '不支持的游戏类型' );
	}
	
	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * 生成模拟数据（用于测试）
 * @param {string} gameType 游戏类型
 * @returns {Object} 模拟数据
 */
export function generateMockData( gameType ) {
	const gameNames = {
		zzz: '绝区零',
		sr: '崩坏：星穹铁道',
		genshin: '原神'
	};
	
	return {
		userInfo: {
			name: '测试用户',
			level: 60,
			server: '官方服务器',
			uid: '123456789',
			avatar: 'https://via.placeholder.com/72x72/4A90E2/ffffff?text=头像'
		},
		analysisData: {
			totalPulls: 180,
			upCharacterCount: 3,
			upCharacterAverage: 60,
			upCharacterRate: '50%',
			permanentCount: 5,
			permanentAverage: 36,
			aRankCount: 18,
			aRankAverage: 10,
			upWeaponAverage: gameType !== 'genshin' ? 45 : undefined,
			achievement: '欧皇'
		},
		gachaPools: [
			{
				name: '限定池',
				type: 'limited',
				items: [
					{
						name: '测试角色A',
						image: 'https://via.placeholder.com/64x64/FFD700/000000?text=5★',
						count: 60,
						isCrooked: false,
						rarity: 5
					},
					{
						name: '测试角色B',
						image: 'https://via.placeholder.com/64x64/A855F7/ffffff?text=4★',
						count: 20,
						isCrooked: false,
						rarity: 4
					}
				]
			},
			{
				name: '常驻池',
				type: 'permanent',
				items: [
					{
						name: '常驻角色A',
						image: 'https://via.placeholder.com/64x64/FFD700/000000?text=5★',
						count: 80,
						isCrooked: true,
						rarity: 5
					}
				]
			}
		],
		chartData: {
			type: 'pie',
			title: `${ gameNames[gameType] }抽卡分布`,
			data: [
				{ label: '限定池', value: 120 },
				{ label: '常驻池', value: 60 }
			]
		},
		gameType
	};
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间
 * @returns {Function} 防抖后的函数
 */
export function debounce( func, wait ) {
	let timeout;
	return function executedFunction( ...args ) {
		const later = () => {
			clearTimeout( timeout );
			func( ...args );
		};
		clearTimeout( timeout );
		timeout = setTimeout( later, wait );
	};
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 限制时间
 * @returns {Function} 节流后的函数
 */
export function throttle( func, limit ) {
	let inThrottle;
	return function ( ...args ) {
		if ( !inThrottle ) {
			func.apply( this, args );
			inThrottle = true;
			setTimeout( () => inThrottle = false, limit );
		}
	};
}

/**
 * 深拷贝对象
 * @param {*} obj 要拷贝的对象
 * @returns {*} 拷贝后的对象
 */
export function deepClone( obj ) {
	if ( obj === null || typeof obj !== 'object' ) {
		return obj;
	}
	
	if ( obj instanceof Date ) {
		return new Date( obj.getTime() );
	}
	
	if ( obj instanceof Array ) {
		return obj.map( item => deepClone( item ) );
	}
	
	if ( typeof obj === 'object' ) {
		const clonedObj = {};
		for ( const key in obj ) {
			if ( obj.hasOwnProperty( key ) ) {
				clonedObj[key] = deepClone( obj[key] );
			}
		}
		return clonedObj;
	}
}
