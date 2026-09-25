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
			const gridColor = props.theme.borderColor;
			// 配置图表选项
			return {
				xAxis: {
					type: 'category',
					data: data.map( item => item.label ),
					axisLabel: {
						interval: 0,
						rotate: 30,
						color: textColor,
						fontSize: 10
					},
					axisLine: {
						lineStyle: {
							color: gridColor
						}
					},
					splitLine: {
						show: true,
						lineStyle: {
							color: 'rgba(75, 192, 192, 0.2)'
						}
					},
					boundaryGap: false
				},
				yAxis: {
					type: 'value',
					min: 0,
					interval: 10,
					axisLabel: {
						color: textColor,
						fontSize: 10
					},
					axisLine: {
						show: true,
						lineStyle: {
							color: gridColor
						}
					},
					splitLine: {
						show: true,
						lineStyle: {
							color: 'rgba(75, 192, 192, 0.2)'
						}
					}
				},
				series: [ {
					name: '抽卡次数',
					type: 'line',
					data: data.map( item => item.value ),
					itemStyle: {
						color: '#35aaa9'
					},
					areaStyle: {
						color: 'rgba(53, 170, 169, 0.12)'
					},
					lineStyle: {
						width: 2,
						color: '#35aaa9'
					},
					smooth: true,
					label: {
						show: true,
						position: 'top',
						color: '#35aaa9',
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
