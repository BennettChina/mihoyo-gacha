/**
 * 抽卡池卡片组件
 * 显示抽卡池分布，支持物品展示和交互
 */

export const GachaPoolCard = {
	name: 'GachaPoolCard',
	props: {
		gachaPools: {
			type: Array,
			required: true
		},
		theme: {
			type: Object,
			required: true
		},
		title: {
			type: String,
			default: '抽卡池分布'
		}
	},
	emits: [ 'item-click' ],
	setup( props, { emit } ) {
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
				'--gacha-text-color': theme.gachaTextColor,
				'--border-color': theme.borderColor,
				'--gacha-background': theme.gachaBackground
			};
		} );
		
		// 计算物品缩略图地址
		const getItemImage = ( url ) => {
			return `${ url }?x-oss-process=image/quality,q_75/resize,s_278/format,webp`;
		};
		
		// 获取物品样式类
		const getItemClass = ( item ) => {
			const classes = [ 'pool-item-avatar' ];
			
			// 根据稀有度添加样式
			if ( item.rarity >= 5 ) {
				classes.push( 'rarity-5' );
			} else if ( item.rarity >= 4 ) {
				classes.push( 'rarity-4' );
			} else {
				classes.push( 'rarity-3' );
			}
			
			return classes.join( ' ' );
		};
		
		// 获取抽数样式类
		const getItemCountClass = ( count ) => {
			if ( count <= 10 ) {
				return 'count-veryhigh'; // 超欧
			} else if ( count <= 30 ) {
				return 'count-high'; // 欧皇
			} else if ( count <= 60 ) {
				return 'count-mid'; // 普通
			} else {
				return 'count-low'; // 非酋
			}
		};
		
		// 物品点击事件
		const onItemClick = ( item ) => {
			emit( 'item-click', item );
		};
		
		return {
			cssVariables,
			getItemClass,
			getItemCountClass,
			onItemClick,
			getItemImage
		};
	},
	template: `
    <div class="gacha-pool-card" :style="cssVariables">
      <div class="pool-flex">
        <template v-for="pool in gachaPools" :key="pool.type">
	        <div v-if="pool.items.length">
	          <div class="pool-block">
	          	<span>{{ pool.name }}</span>
	          	<span>{{ pool.items.length -1 }}（个）/{{ pool.count }}（总抽数）</span>
			  </div>
	          <div class="pool-items">
	            <div
	              v-for="item in pool.items"
	              :key="pool.type + '-' + item.name"
	              :class="getItemClass(item)"
	              :data-count="item.count"
	              @click="onItemClick(item)"
	            >
	              <div class="avatar-container"><img src="../assets/images/question-mark.png" :alt="item.name" v-if="item.name === '?'">
	              <img v-else :alt="item.name" :src="getItemImage(item.image)" /></div>
	              <div class="avatar-count" :class="getItemCountClass(item.count)">
	                {{ item.count }}
	              </div>
	              <div v-if="item.isCrooked" class="crooked">歪</div>
	            </div>
	          </div>
	        </div>
		</template>
      </div>
    </div>
  `
};
