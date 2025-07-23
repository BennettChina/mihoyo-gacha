import { Avatar, GameType } from "#/mihoyo-gacha/util/types";
import { metaManagement } from "#/mihoyo-gacha/init";

export class GameAvatar {
	
	async getAvatar( game: GameType, type: "character" | "weapon" | "bangboo", name: string ): Promise<Avatar | undefined> {
		if ( game === GameType.GENSHIN ) {
			if ( type === "bangboo" ) throw new Error( "原神不支持邦布" );
			const avatars = await this.getGenshinAvatar( type );
			return avatars.find( a => a.item_name === name );
		}
		if ( game === GameType.STAR_RAIL ) {
			if ( type === "bangboo" ) throw new Error( "星穹铁道不支持邦布" );
			const avatars = await this.getStarRailAvatar( type );
			return avatars.find( a => a.item_name === name );
		}
		if ( game === GameType.ZZZ ) {
			name = name.replace( /[「」]/g, "" );
			const avatars = await this.getZzzAvatar( type );
			return avatars.find( a => a.item_name === name );
		}
	}
	
	async getGenshinAvatar( type: "character" | "weapon" ): Promise<Avatar[]> {
		return metaManagement.getMeta( `meta/genshin/${ type }` );
	}
	
	async getStarRailAvatar( type: "character" | "weapon" ): Promise<Avatar[]> {
		return metaManagement.getMeta( `meta/sr/${ type }` );
	}
	
	async getZzzAvatar( type: "character" | "weapon" | "bangboo" ): Promise<Avatar[]> {
		return metaManagement.getMeta( `meta/zzz/${ type }` );
	}
}