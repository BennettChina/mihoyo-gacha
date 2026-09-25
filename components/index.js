/**
 * 米哈游抽卡分析主组件
 * 整合所有子组件，提供完整的抽卡分析功能
 */

import { UserInfoCard } from './UserInfoCard.js';
import { AnalysisCard } from './AnalysisCard.js';
import { GachaPoolCard } from './GachaPoolCard.js';
import { GachaChart } from './GachaChart.js';
import { AchievementCard } from './AchievementCard.js';

export const GachaAnalysis = {
	name: 'GachaAnalysis',
	components: {
		UserInfoCard,
		AnalysisCard,
		GachaPoolCard,
		GachaChart,
		AchievementCard
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
					userBackground: 'url("/mihoyo-gacha/assets/images/user-zzz-bg.webp") center center no-repeat',
					userBackgroundColor: '#202020',
					gachaBackground: '#292a31',
					appBackground: "#23242a url('https://baike.mihoyo.com/zzz/wiki/pc-page-bg.png') repeat",
					overviewAnalysisBackground: 'linear-gradient(180deg, #FFDE00 0%, #F4D400 100%)',
					overviewAnalysisBorder: '#FFDE00',
					overviewAnalysisText: '#23242A',
					overviewAnalysisMuted: '#5B542A',
					overviewAnalysisDivider: 'rgba(35, 36, 42, 0.18)',
					overviewAnalysisAccent: '#8A6E00',
					overviewPanelBackground: '#202126',
					overviewPanelBorder: '#474950',
					overviewPanelDivider: '#3E4047',
					overviewPanelText: '#F7F3E8',
					overviewPanelMuted: '#B9B5A9',
					overviewPanelAccent: '#FFDE00',
					overviewStatBackground: 'rgba(255, 255, 255, 0.42)',
					overviewStatBorder: 'rgba(35, 36, 42, 0.22)',
					chartColor: '#FFDE00',
					chartAreaColor: 'rgba(255, 222, 0, 0.12)',
					chartGridColor: 'rgba(255, 222, 0, 0.16)',
					evalExcellentBackground: 'rgba(198, 226, 128, 0.16)',
					evalExcellentBorder: 'rgba(198, 226, 128, 0.34)',
					evalExcellentText: '#D9E8AE',
					evalNormalBackground: 'rgba(189, 190, 198, 0.12)',
					evalNormalBorder: 'rgba(189, 190, 198, 0.28)',
					evalNormalText: '#D6D4CF',
					evalPoorBackground: 'rgba(255, 154, 107, 0.16)',
					evalPoorBorder: 'rgba(255, 154, 107, 0.34)',
					evalPoorText: '#FFC09D'
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
					userBackground: 'url("/mihoyo-gacha/assets/images/user-sr-bg.webp") center center no-repeat',
					userBackgroundColor: '#38569F',
					gachaBackground: '#16213e',
					appBackground: '#1a1a2e',
					overviewAnalysisBackground: 'linear-gradient(180deg, #4A90E2 0%, #3C7FD0 100%)',
					overviewAnalysisBorder: '#4A90E2',
					overviewAnalysisText: '#FFFFFF',
					overviewAnalysisMuted: '#DCEBFF',
					overviewAnalysisDivider: 'rgba(255, 255, 255, 0.22)',
					overviewAnalysisAccent: '#DCEEFF',
					overviewPanelBackground: '#172138',
					overviewPanelBorder: '#3C4F73',
					overviewPanelDivider: '#30405F',
					overviewPanelText: '#F2F6FF',
					overviewPanelMuted: '#A9B9D6',
					overviewPanelAccent: '#7BB3F0',
					overviewStatBackground: 'rgba(255, 255, 255, 0.13)',
					overviewStatBorder: 'rgba(255, 255, 255, 0.28)',
					chartColor: '#58D6E8',
					chartAreaColor: 'rgba(88, 214, 232, 0.12)',
					chartGridColor: 'rgba(88, 214, 232, 0.16)',
					evalExcellentBackground: 'rgba(104, 211, 157, 0.16)',
					evalExcellentBorder: 'rgba(104, 211, 157, 0.34)',
					evalExcellentText: '#9CE5C0',
					evalNormalBackground: 'rgba(133, 155, 190, 0.14)',
					evalNormalBorder: 'rgba(133, 155, 190, 0.32)',
					evalNormalText: '#C7D4E8',
					evalPoorBackground: 'rgba(255, 153, 102, 0.16)',
					evalPoorBorder: 'rgba(255, 153, 102, 0.34)',
					evalPoorText: '#FFC49F'
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
					userBackground: 'url("/mihoyo-gacha/assets/images/user-genshin-bg.webp") no-repeat center center',
					userBackgroundColor: '#836855',
					gachaBackground: '#FAF9F5',
					appBackground: '#f5f2e9',
					overviewAnalysisBackground: 'linear-gradient(135deg, #FBF8F0 0%, #EEE5D2 100%)',
					overviewAnalysisBorder: '#D0BE9D',
					overviewAnalysisText: '#5C5145',
					overviewAnalysisMuted: '#7D7265',
					overviewAnalysisDivider: '#DED5C5',
					overviewAnalysisAccent: '#B49667',
					overviewPanelBackground: '#F5F2EB',
					overviewPanelBorder: '#D8CEBD',
					overviewPanelDivider: '#DED5C5',
					overviewPanelText: '#5C5145',
					overviewPanelMuted: '#7D7265',
					overviewPanelAccent: '#B49667',
					overviewStatBackground: '#FBFAF6',
					overviewStatBorder: '#E2DACD',
					chartColor: '#48AAA3',
					chartAreaColor: 'rgba(72, 170, 163, 0.10)',
					chartGridColor: 'rgba(72, 170, 163, 0.17)',
					evalExcellentBackground: '#E6F0D7',
					evalExcellentBorder: '#CEDCAE',
					evalExcellentText: '#56633F',
					evalNormalBackground: '#F0ECE4',
					evalNormalBorder: '#DDD5C7',
					evalNormalText: '#665F55',
					evalPoorBackground: '#F6DFCA',
					evalPoorBorder: '#EAC2A1',
					evalPoorText: '#875333'
				}
			};
			return themes[gameType] || themes.zzz;
		};
		
		// 组件状态
		const params = getURLParams();
		const gameType = params.game;
		const theme = getGameTheme( gameType );
		const historyTitle = computed( () => ( {
			genshin: '祈愿履历',
			sr: '跃迁履历',
			zzz: '频段履历'
		}[gameType] || '抽卡履历' ) );
		
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
			'--app-background': theme.appBackground,
			'--overview-analysis-background': theme.overviewAnalysisBackground,
			'--overview-analysis-border': theme.overviewAnalysisBorder,
			'--overview-analysis-text': theme.overviewAnalysisText,
			'--overview-analysis-muted': theme.overviewAnalysisMuted,
			'--overview-analysis-divider': theme.overviewAnalysisDivider,
			'--overview-analysis-accent': theme.overviewAnalysisAccent,
			'--overview-panel-background': theme.overviewPanelBackground,
			'--overview-panel-border': theme.overviewPanelBorder,
			'--overview-panel-divider': theme.overviewPanelDivider,
			'--overview-panel-text': theme.overviewPanelText,
			'--overview-panel-muted': theme.overviewPanelMuted,
			'--overview-panel-accent': theme.overviewPanelAccent,
			'--overview-stat-background': theme.overviewStatBackground,
			'--overview-stat-border': theme.overviewStatBorder,
			'--eval-excellent-background': theme.evalExcellentBackground,
			'--eval-excellent-border': theme.evalExcellentBorder,
			'--eval-excellent-text': theme.evalExcellentText,
			'--eval-normal-background': theme.evalNormalBackground,
			'--eval-normal-border': theme.evalNormalBorder,
			'--eval-normal-text': theme.evalNormalText,
			'--eval-poor-background': theme.evalPoorBackground,
			'--eval-poor-border': theme.evalPoorBorder,
			'--eval-poor-text': theme.evalPoorText
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
			historyTitle,
			cssVariables,
			retry,
			onPoolItemClick,
			onChartClick,
			onChartReady
		};
	},
	template: `
    <div id="app" v-if="state.data" :style="cssVariables">
      <UserInfoCard
        v-if="state.data.userInfo"
        :user-info="state.data.userInfo"
        :theme="theme"
      />

      <main class="dashboard-grid">
        <AnalysisCard
          v-if="state.data.analysisData"
          :analysis-data="state.data.analysisData"
          :theme="theme"
          :game-type="gameType"
        />
        <div class="overview-secondary-panel">
          <GachaChart
            :key="state.data.chartData.title"
            v-if="state.data.chartData && state.data.chartData.data.length > 0"
            :chart-data="state.data.chartData"
            :theme="theme"
          />
          <AchievementCard
            v-if="state.data.analysisData"
            :achievements="state.data.analysisData.achievement"
            :theme="theme"
          />
        </div>
      </main>

      <GachaPoolCard
        v-if="state.data.gachaPools && state.data.gachaPools.length > 0"
        :gacha-pools="state.data.gachaPools"
        :theme="theme"
        :title="historyTitle"
        @item-click="onPoolItemClick"
      />
    </div>
  `
};
