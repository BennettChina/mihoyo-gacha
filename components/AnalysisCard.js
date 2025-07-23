/**
 * 分析数据卡片组件
 * 显示抽卡统计数据，支持多游戏配置
 */

export const AnalysisCard = {
	name: 'AnalysisCard',
	props: {
		analysisData: {
			type: Object,
			required: true
		},
		theme: {
			type: Object,
			required: true
		},
		gameType: {
			type: String,
			required: true
		},
		title: {
			type: String,
			default: '抽卡分析'
		}
	},
	setup( props ) {
		const { computed } = Vue;
		
		// 计算CSS变量
		const cssVariables = computed( () => {
			const theme = props.theme;
			return {
				'--primary-color': theme.primaryColor,
				'--secondary-color': theme.secondaryColor,
				'--background-color': theme.backgroundColor,
				'--card-background-color': theme.cardBackgroundColor,
				'--text-color': theme.textColor,
				'--border-color': theme.borderColor
			};
		} );
		
		// 根据游戏类型计算标签
		const gameLabels = computed( () => {
			const labels = {
				zzz: {
					weaponLabel: 'UP音擎平均',
					upWeaponRate: '音擎不歪率',
					aRankLabel: 'A级代理人个数',
					aRankAverage: 'A级代理人平均',
				},
				sr: {
					weaponLabel: 'UP光锥平均',
					upWeaponRate: '光锥不歪率',
					aRankLabel: '4星角色个数',
					aRankAverage: '4星角色平均',
				},
				genshin: {
					weaponLabel: 'UP武器平均',
					upWeaponRate: '武器不歪率',
					aRankLabel: '4星角色个数',
					aRankAverage: '4星角色平均',
				}
			};
			return labels[props.gameType] || labels.zzz;
		} );
		
		// 成就评价样式类
		const achievementClass = ( item ) => {
			if ( !item ) return "";
			if ( [ '2A级景区', '3A级景区' ].includes( item ) ) {
				return 'eval-normal';
			}
			if ( item.includes( '连不歪' ) || item.includes( '黄蛋' ) || item.includes( 'A级景区' ) ) {
				return 'eval-excellent';
			}
			if ( [ '一发入魂', '欧皇时刻' ].includes( item ) ) {
				return 'eval-excellent';
			}
			if ( item.includes( '连大保底' ) || [ '非酋竟是我自己' ].includes( item ) ) {
				return 'eval-poor';
			}
			return 'eval-normal';
		};
		
		return {
			cssVariables,
			gameLabels,
			achievementClass
		};
	},
	template: `
    <div class="analysis-card" :style="cssVariables">
      <div class="analysis-data">
        <div class="analysis-row">
          <div class="analysis-item">
            <div class="item-value">{{ analysisData.totalPulls }}</div>
            <div class="item-label">总抽数</div>
          </div>
          <div class="analysis-item">
            <div class="item-value">{{ analysisData.upCharacterRate }}</div>
            <div class="item-label">角色不歪率</div>
          </div>
          <div class="analysis-item">
            <div class="item-value">{{ analysisData.upWeaponRate }}</div>
            <div class="item-label">{{ gameLabels.upWeaponRate }}</div>
          </div>
        </div>
        <div class="analysis-row">
          <div class="analysis-item">
            <div class="item-value">{{ analysisData.upCharacterAverage }}</div>
            <div class="item-label">UP角色平均</div>
          </div>
          <div class="analysis-item">
            <div class="item-value">{{ analysisData.upWeaponAverage }}</div>
            <div class="item-label">{{ gameLabels.weaponLabel }}</div>
          </div>
          <div class="analysis-item">
            <div class="item-value">{{ analysisData.permanentAverage }}</div>
            <div class="item-label">常驻每金平均</div>
          </div>
        </div>
        <div class="analysis-row">
          <div class="analysis-item">
            <div class="item-value">{{ analysisData.aRankCount }}</div>
            <div class="item-label">{{ gameLabels.aRankLabel }}</div>
          </div>
          <div class="analysis-item">
            <div class="item-value">{{ analysisData.aRankAverage }}</div>
            <div class="item-label">{{ gameLabels.aRankAverage }}</div>
          </div>
          <div class="analysis-item">
            <div class="item-value">{{ analysisData.favorite }}/{{ analysisData.favoriteCount }}(抽)</div>
            <div class="item-label">最钟爱你的TA</div>
          </div>
        </div>
      </div>
      <div class="achievement-eval">
        <span class="eval-label">成就评价：</span>
        <div class="eval-result-box"><span class="eval-result" :class="achievementClass(item)" v-for="item in analysisData.achievement" :key="item">{{ item }}</span></div>
      </div>
    </div>
  `
};
