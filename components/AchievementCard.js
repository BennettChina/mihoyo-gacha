/**
 * 成就评价卡片组件
 * 独立展示抽卡成就标签，便于与统计、趋势组成顶部三栏布局
 */

export const AchievementCard = {
	name: 'AchievementCard',
	props: {
		achievements: {
			type: Array,
			default: () => []
		},
		theme: {
			type: Object,
			required: true
		},
		title: {
			type: String,
			default: '成就评价'
		}
	},
	setup( props ) {
		const { computed } = Vue;
		
		const cssVariables = computed( () => ( {
			'--primary-color': props.theme.primaryColor,
			'--secondary-color': props.theme.secondaryColor,
			'--background-color': props.theme.backgroundColor,
			'--card-background-color': props.theme.cardBackgroundColor,
			'--text-color': props.theme.textColor,
			'--border-color': props.theme.borderColor
		} ) );
		
		const achievementClass = ( item ) => {
			if ( !item ) return '';
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
			achievementClass
		};
	},
	template: `
    <div class="achievement-card" :style="cssVariables">
      <div class="panel-heading">
        <span class="panel-icon">✦</span>
        <span class="panel-title">{{ title }}</span>
      </div>
      <div class="eval-result-box">
        <span
          class="eval-result"
          :class="achievementClass(item)"
          v-for="item in achievements"
          :key="item"
        >{{ item }}</span>
      </div>
    </div>
  `
};
