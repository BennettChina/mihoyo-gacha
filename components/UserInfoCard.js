/**
 * 用户信息卡片组件
 * 显示用户基本信息，支持多游戏主题
 */

export const UserInfoCard = {
	name: 'UserInfoCard',
	props: {
		userInfo: {
			type: Object,
			required: true
		},
		theme: {
			type: Object,
			required: true
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
				'--user-text-color': theme.userTextColor,
				'--border-color': theme.borderColor,
				'--gradient-special-start': theme.gradients.special[0],
				'--gradient-special-end': theme.gradients.special[1],
				'--user-background-image': theme.userBackground
			};
		} );
		
		return {
			cssVariables
		};
	},
	template: `
    <div class="user-info-card" :style="cssVariables">
      <div class="user-avatar">
        <img :src="userInfo.avatar || 'https://bbs-static.miyoushe.com/avatar/avatar1.png'" :alt="userInfo.name + '的头像'" />
      </div>
      <div class="user-basic">
        <div class="user-name">{{ userInfo.nickname || '未知用户' }}</div>
        <div class="user-details">
          <span class="user-level">LV.{{ userInfo.level || '--' }}</span>
          <span class="user-server">{{ userInfo.serverName || '--' }}</span>
          <span class="user-uid">UID{{ userInfo.uid }}</span>
        </div>
      </div>
    </div>
  `
};
