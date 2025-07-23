import { metaManagement } from "#/mihoyo-gacha/init";
import { GachaUpItem, GameType } from "#/mihoyo-gacha/util/types";

export class GachaHistoryUpItem {
	
	public async get( gameType: GameType, type: GachaUpItem["type"] ): Promise<GachaUpItem[]> {
		const gachaHistory = metaManagement.getMeta( `meta/${ gameType }/history` );
		return gachaHistory.filter( item => item.type === type );
	}
}