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
			// 配置图表选项
			return {
				title: {
					text: '近期抽卡走势',
					left: 'center',
					textStyle: {
						color: 'rgba(75, 192, 192, 1)'
					}
				},
				xAxis: {
					type: 'category',
					data: data.map( item => item.label ),
					axisLabel: {
						interval: 0,
						rotate: 30
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
						color: 'rgba(75, 192, 192, 1)'
					},
					areaStyle: {
						color: 'rgba(75, 192, 192, 0.2)'
					},
					lineStyle: {
						width: 2,
						color: 'rgba(75, 192, 192, 1)'
					},
					smooth: true,
					label: {
						show: true,
						position: 'top',
						color: 'rgba(75, 192, 192, 1)'
					}
				} ],
				tooltip: {
					trigger: 'axis',
					formatter: function ( params ) {
						return params[0].name + ': ' + params[0].value + '抽';
					}
				},
				grid: {
					left: '3%',
					right: '4%',
					bottom: '10%',
					top: '10%',
					containLabel: true
				},
				...options
			};
		} );
		
		return {
			cssVariables,
			getChartOption,
		};
	},
	template: `
      <v-chart class="chart-container" :option="getChartOption" autoresize :style="cssVariables" />
  `
};
