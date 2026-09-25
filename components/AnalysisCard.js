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
			default: '抽卡概况'
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
		
		return {
			cssVariables,
			gameLabels
		};
	},
	template: `
    <div class="analysis-card" :style="cssVariables">
      <div class="panel-heading">
        <span class="panel-icon">◎</span>
        <span class="panel-title">{{ title }}</span>
      </div>
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
    </div>
  `
};
