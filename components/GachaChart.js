/**
 * 图表组件
 * 基于ECharts的图表展示，支持多种图表类型和主题
 */

export const GachaChart = {
	name: 'GachaChart',
	props: {
		chartData: {
			type: Object,
			required: true
		},
		theme: {
			type: Object,
			required: true
		},
		height: {
			type: [ String, Number ],
			default: '100%'
		},
		width: {
			type: [ String, Number ],
			default: '546px'
		}
	},
	components: {
		'v-chart': window.VueECharts
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
		
		// 生成ECharts配置
		const getChartOption = computed( () => {
			const { data, options = {} } = props.chartData;
			const textColor = props.theme.textColor;
			const overviewTextColor = props.theme.overviewPanelText || textColor;
			const gridColor = props.theme.chartGridColor || 'rgba(72, 170, 163, 0.17)';
			const chartColor = props.theme.chartColor || '#48AAA3';
			const chartAreaColor = props.theme.chartAreaColor || 'rgba(72, 170, 163, 0.10)';
			// 配置图表选项
			return {
				xAxis: {
					type: 'category',
					data: data.map( item => item.label ),
					axisLabel: {
						interval: 0,
						rotate: 30,
						color: overviewTextColor,
						fontSize: 10
					},
					axisLine: {
						lineStyle: {
							color: props.theme.overviewPanelDivider || props.theme.borderColor
						}
					},
					splitLine: {
						show: true,
						lineStyle: {
							color: gridColor
						}
					},
					boundaryGap: false
				},
				yAxis: {
					type: 'value',
					min: 0,
					interval: 10,
					axisLabel: {
						color: overviewTextColor,
						fontSize: 10
					},
					axisLine: {
						show: true,
						lineStyle: {
							color: props.theme.overviewPanelDivider || props.theme.borderColor
						}
					},
					splitLine: {
						show: true,
						lineStyle: {
							color: gridColor
						}
					}
				},
				series: [ {
					name: '抽卡次数',
					type: 'line',
					data: data.map( item => item.value ),
					itemStyle: {
						color: chartColor
					},
					areaStyle: {
						color: chartAreaColor
					},
					lineStyle: {
						width: 2,
						color: chartColor
					},
					smooth: true,
					label: {
						show: true,
						position: 'top',
						color: chartColor,
						fontSize: 10,
						fontWeight: 600
					}
				} ],
				tooltip: {
					trigger: 'axis',
					formatter: function ( params ) {
						return params[0].name + ': ' + params[0].value + '抽';
					}
				},
				grid: {
					left: '1%',
					right: '2%',
					bottom: '8%',
					top: '8%',
					containLabel: true
				},
				animationDuration: 500,
				...options
			};
		} );
		
		return {
			cssVariables,
			getChartOption,
		};
	},
	template: `
      <div class="chart-card" :style="cssVariables">
        <div class="panel-heading">
          <span class="panel-icon">⌁</span>
          <span class="panel-title">近期抽卡走势</span>
        </div>
        <v-chart class="chart-container" :option="getChartOption" autoresize />
      </div>
  `
};
