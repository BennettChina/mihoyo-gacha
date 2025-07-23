/**
 * 米哈游抽卡分析主组件
 * 整合所有子组件，提供完整的抽卡分析功能
 */

import { UserInfoCard } from './UserInfoCard.js';
import { AnalysisCard } from './AnalysisCard.js';
import { GachaPoolCard } from './GachaPoolCard.js';
import { GachaChart } from './GachaChart.js';

export const GachaAnalysis = {
	name: 'GachaAnalysis',
	components: {
		UserInfoCard,
		AnalysisCard,
		GachaPoolCard,
		GachaChart
	},
	setup() {
		const { reactive, computed, onMounted } = Vue;
		
		// 获取URL参数
		const getURLParams = () => {
			const params = new URLSearchParams( window.location.search );
			return {
				qq: params.get( 'qq' ),
				game: params.get( 'game' ) || 'genshin',
				style: params.get( 'style' ) || '1'
			};
		};
		
		// 获取游戏主题配置
		const getGameTheme = ( gameType ) => {
			const themes = {
				zzz: {
					name: '绝区零',
					primaryColor: '#FFDE00',
					secondaryColor: '#FFA500',
					backgroundColor: '#f5f2e9',
					cardBackgroundColor: '#faf9f5',
					textColor: '#23242a',
					userTextColor: '#FFFFFF',
					gachaTextColor: '#FFDE00',
					borderColor: '#35363d',
					gradients: {
						limited: [ '#ffbaba', '#ff7b7b' ],
						weapon: [ '#b5eaff', '#5ecfff' ],
						permanent: [ '#eaffb5', '#baff7b' ],
						special: [ '#9b59b6', '#8e44ad' ]
					},
					userBackground: 'url("/mihoyo-gacha/assets/images/user-zzz-bg.png") center center no-repeat',
					gachaBackground: '#292a31',
					appBackground: "#23242a url('https://baike.mihoyo.com/zzz/wiki/pc-page-bg.png') repeat"
				},
				sr: {
					name: '崩坏：星穹铁道',
					primaryColor: '#4A90E2',
					secondaryColor: '#7BB3F0',
					backgroundColor: '#1a1a2e',
					cardBackgroundColor: '#16213e',
					textColor: '#ffffff',
					userTextColor: '#ffffff',
					gachaTextColor: '#ffffff',
					borderColor: '#0f3460',
					gradients: {
						limited: [ '#ff6b9d', '#ff8fab' ],
						weapon: [ '#4ecdc4', '#44a08d' ],
						permanent: [ '#a8e6cf', '#7fcdcd' ],
						special: [ '#ffd93d', '#6bcf7f' ]
					},
					userBackground: 'url("/mihoyo-gacha/assets/images/user-sr-bg.png") center center no-repeat',
					gachaBackground: '#16213e',
					appBackground: '#1a1a2e'
				},
				genshin: {
					name: '原神',
					primaryColor: '#E0D9C7',
					secondaryColor: '#FDF6EC',
					backgroundColor: '#2c3e50',
					cardBackgroundColor: '#E7DBC5',
					textColor: '#5C4A38',
					userTextColor: '#FFFFFF',
					gachaTextColor: '#5C4A38',
					borderColor: '#FAF9F5',
					gradients: {
						limited: [ '#e74c3c', '#c0392b' ],
						weapon: [ '#f39c12', '#e67e22' ],
						permanent: [ '#27ae60', '#2ecc71' ],
						special: [ '#9b59b6', '#8e44ad' ]
					},
					userBackground: 'url("/mihoyo-gacha/assets/images/user-genshin-bg.png") no-repeat center center',
					gachaBackground: '#FAF9F5',
					appBackground: '#f5f2e9'
				}
			};
			return themes[gameType] || themes.zzz;
		};
		
		// 组件状态
		const params = getURLParams();
		const gameType = params.game;
		const theme = getGameTheme( gameType );
		
		const state = reactive( {
			loading: true,
			error: null,
			data: null
		} );
		
		// 设置页面标题
		document.title = `${ theme.name }抽卡分析 - Adachi-BOT`;
		
		// 生成CSS变量
		const cssVariables = computed( () => ( {
			'--primary-color': theme.primaryColor,
			'--secondary-color': theme.secondaryColor,
			'--background-color': theme.backgroundColor,
			'--card-background-color': theme.cardBackgroundColor,
			'--text-color': theme.textColor,
			'--border-color': theme.borderColor,
			'--app-background': theme.appBackground
		} ) );
		
		// 模拟数据加载
		const loadData = async () => {
			try {
				state.loading = true;
				state.error = null;
				
				if ( !params.qq ) {
					throw new Error( '缺少QQ参数' );
				}
				
				// 这里应该是实际的API调用
				const response = await fetch( `/mihoyo-gacha/api/analysis/result?qq=${ params.qq }&game=${ gameType }` );
				const { data } = await response.json();
				state.data = data;
				
				const user_info = await fetch( `/mihoyo-gacha/api/analysis/user-info?qq=${ params.qq }&game=${ gameType }` );
				const user_data = await user_info.json();
				state.data.userInfo = user_data.userInfo;
				
			} catch ( error ) {
				state.error = error.message;
				console.error( '加载数据失败:', error );
			} finally {
				state.loading = false;
			}
		};
		
		// 重试函数
		const retry = () => {
			loadData();
		};
		
		// 事件处理
		const onPoolItemClick = ( item ) => {
			console.log( '点击物品:', item );
		};
		
		const onChartClick = ( params ) => {
			console.log( '点击图表:', params );
		};
		
		const onChartReady = ( chart ) => {
			console.log( '图表准备就绪:', chart );
		};
		
		onMounted( () => {
			loadData();
		} );
		
		return {
			state,
			theme,
			gameType,
			cssVariables,
			retry,
			onPoolItemClick,
			onChartClick,
			onChartReady
		};
	},
	template: `
    <div id="app" v-if="state.data" :style="cssVariables">
	   <div class="flex-row">
	        <div>
		        <UserInfoCard
		          v-if="state.data.userInfo"
		          :user-info="state.data.userInfo"
		          :theme="theme"
		        />
		        
		        <AnalysisCard
		          v-if="state.data.analysisData"
		          :analysis-data="state.data.analysisData"
		          :theme="theme"
		          :game-type="gameType"
		          :title="theme.name + '抽卡分析'"
		        />
		        <GachaChart
		          :key="state.data.chartData.title"
		          v-if="state.data.chartData && state.data.chartData.data.length > 0"
		          :chart-data="state.data.chartData"
		          :theme="theme"
		        />
			</div>
			<GachaPoolCard
			          v-if="state.data.gachaPools && state.data.gachaPools.length > 0"
			          :gacha-pools="state.data.gachaPools"
			          :theme="theme"
			          :title="theme.name + '抽卡池分布'"
			          @item-click="onPoolItemClick"
			        />
		</div>
      </div>
  `
};
