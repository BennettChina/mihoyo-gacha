/**
 * 游戏配置和主题系统
 * 支持绝区零、崩坏：星穹铁道、原神三个游戏
 */

// 游戏类型枚举
export const GameType = {
	ZZZ: 'zzz',
	STAR_RAIL: 'sr',
	GENSHIN: 'genshin'
};

// 绝区零主题配置
export const ZZZ_THEME = {
	gameType: GameType.ZZZ,
	name: '绝区零',
	primaryColor: '#FFDE00',
	secondaryColor: '#FFA500',
	backgroundColor: '#f5f2e9',
	cardBackgroundColor: '#faf9f5',
	textColor: '#23242a',
	borderColor: '#35363d',
	gradients: {
		limited: [ '#ffbaba', '#ff7b7b' ],
		weapon: [ '#b5eaff', '#5ecfff' ],
		permanent: [ '#eaffb5', '#baff7b' ],
		special: [ '#e3d1ff', '#bfaaff' ]
	}
};

// 崩坏：星穹铁道主题配置
export const STAR_RAIL_THEME = {
	gameType: GameType.STAR_RAIL,
	name: '崩坏：星穹铁道',
	primaryColor: '#4A90E2',
	secondaryColor: '#7BB3F0',
	backgroundColor: '#1a1a2e',
	cardBackgroundColor: '#16213e',
	textColor: '#ffffff',
	borderColor: '#0f3460',
	gradients: {
		limited: [ '#ff6b9d', '#ff8fab' ],
		weapon: [ '#4ecdc4', '#44a08d' ],
		permanent: [ '#a8e6cf', '#7fcdcd' ],
		special: [ '#ffd93d', '#6bcf7f' ]
	}
};

// 原神主题配置
export const GENSHIN_THEME = {
	gameType: GameType.GENSHIN,
	name: '原神',
	primaryColor: '#00D4FF',
	secondaryColor: '#4FC3F7',
	backgroundColor: '#2c3e50',
	cardBackgroundColor: '#34495e',
	textColor: '#ecf0f1',
	borderColor: '#3498db',
	gradients: {
		limited: [ '#e74c3c', '#c0392b' ],
		weapon: [ '#f39c12', '#e67e22' ],
		permanent: [ '#27ae60', '#2ecc71' ],
		special: [ '#9b59b6', '#8e44ad' ]
	}
};

// 主题映射表
export const GAME_THEMES = {
	[GameType.ZZZ]: ZZZ_THEME,
	[GameType.STAR_RAIL]: STAR_RAIL_THEME,
	[GameType.GENSHIN]: GENSHIN_THEME
};

/**
 * 获取游戏主题
 * @param {string} gameType 游戏类型
 * @param {Object} customTheme 自定义主题（可选）
 * @returns {Object} 主题配置
 */
export function getGameTheme( gameType, customTheme = {} ) {
	const baseTheme = GAME_THEMES[gameType];
	if ( !baseTheme ) {
		throw new Error( `不支持的游戏类型: ${ gameType }` );
	}
	
	if ( Object.keys( customTheme ).length > 0 ) {
		return {
			...baseTheme,
			...customTheme,
			gradients: {
				...baseTheme.gradients,
				...customTheme.gradients
			}
		};
	}
	
	return baseTheme;
}

/**
 * 生成CSS变量
 * @param {Object} theme 主题配置
 * @returns {Object} CSS变量对象
 */
export function generateCSSVariables( theme ) {
	return {
		'--primary-color': theme.primaryColor,
		'--secondary-color': theme.secondaryColor,
		'--background-color': theme.backgroundColor,
		'--card-background-color': theme.cardBackgroundColor,
		'--text-color': theme.textColor,
		'--border-color': theme.borderColor,
		'--gradient-limited-start': theme.gradients.limited[0],
		'--gradient-limited-end': theme.gradients.limited[1],
		'--gradient-weapon-start': theme.gradients.weapon[0],
		'--gradient-weapon-end': theme.gradients.weapon[1],
		'--gradient-permanent-start': theme.gradients.permanent[0],
		'--gradient-permanent-end': theme.gradients.permanent[1],
		'--gradient-special-start': theme.gradients.special[0],
		'--gradient-special-end': theme.gradients.special[1]
	};
}

/**
 * 根据游戏类型获取标签文本
 * @param {string} gameType 游戏类型
 * @returns {Object} 标签文本配置
 */
export function getGameLabels( gameType ) {
	const labels = {
		[GameType.ZZZ]: {
			weaponLabel: 'UP音擎平均',
			aRankLabel: 'A级次数',
			poolTitle: '频段分布'
		},
		[GameType.STAR_RAIL]: {
			weaponLabel: 'UP光锥平均',
			aRankLabel: '4星次数',
			poolTitle: '跃迁分布'
		},
		[GameType.GENSHIN]: {
			weaponLabel: 'UP武器平均',
			aRankLabel: '4星次数',
			poolTitle: '祈愿分布'
		}
	};
	
	return labels[gameType] || labels[GameType.ZZZ];
}

/**
 * 获取成就评价样式类
 * @param {string} achievement 成就评价
 * @returns {string} CSS类名
 */
export function getAchievementClass( achievement ) {
	if ( achievement.includes( '欧皇' ) || achievement.includes( '超欧' ) ) {
		return 'eval-excellent';
	} else if ( achievement.includes( '普通' ) || achievement.includes( '正常' ) ) {
		return 'eval-normal';
	} else if ( achievement.includes( '非酋' ) || achievement.includes( '倒霉' ) ) {
		return 'eval-poor';
	}
	return 'eval-normal';
}

/**
 * 获取物品稀有度样式类
 * @param {number} rarity 稀有度
 * @returns {string} CSS类名
 */
export function getRarityClass( rarity ) {
	if ( rarity >= 5 ) {
		return 'rarity-5';
	} else if ( rarity >= 4 ) {
		return 'rarity-4';
	} else {
		return 'rarity-3';
	}
}

/**
 * 获取抽数统计样式类
 * @param {number} count 抽数
 * @returns {string} CSS类名
 */
export function getCountClass( count ) {
	if ( count <= 10 ) {
		return 'count-veryhigh'; // 超欧
	} else if ( count <= 30 ) {
		return 'count-high'; // 欧皇
	} else if ( count <= 60 ) {
		return 'count-mid'; // 普通
	} else {
		return 'count-low'; // 非酋
	}
}
