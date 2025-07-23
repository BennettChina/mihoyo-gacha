import chokidar from "chokidar";
import path from "path"
import FileManagement from "@/modules/file";
import { Logger } from "log4js";
import { Avatar, GachaUpItem } from "#/mihoyo-gacha/util/types";

interface MetaData {
	"meta/genshin/history": Array<GachaUpItem>;
	"meta/sr/history": Array<GachaUpItem>;
	"meta/zzz/history": Array<GachaUpItem>;
	"meta/genshin/character": Array<Avatar>;
	"meta/genshin/weapon": Array<Avatar>;
	"meta/sr/character": Array<Avatar>;
	"meta/sr/weapon": Array<Avatar>;
	"meta/zzz/character": Array<Avatar>;
	"meta/zzz/weapon": Array<Avatar>;
	"meta/zzz/bangboo": Array<Avatar>;
}

interface WatchEventHandle {
	( data: Record<string, any> | null ): any;
}

export class MetaManagement {
	private eventListeners = new Map<keyof MetaData, WatchEventHandle[]>();
	private watcher: chokidar.FSWatcher | null = null;
	private metaData = <MetaData>{};
	private MetaFunctionMap: Record<keyof MetaData, WatchEventHandle> = {
		"meta/genshin/history": data => ( data || [] ),
		"meta/sr/history": data => ( data || [] ),
		"meta/zzz/history": data => ( data || [] ),
		"meta/genshin/character": data => ( data || [] ),
		"meta/genshin/weapon": data => ( data || [] ),
		"meta/sr/character": data => ( data || [] ),
		"meta/sr/weapon": data => ( data || [] ),
		"meta/zzz/character": data => ( data || [] ),
		"meta/zzz/weapon": data => ( data || [] ),
		"meta/zzz/bangboo": data => ( data || [] )
	}
	
	constructor(
		private file: FileManagement,
		private logger: Logger
	) {
	}
	
	public on( type: keyof MetaData, handle: WatchEventHandle ) {
		const handlers = this.eventListeners.get( type );
		if ( handlers ) {
			handlers.push( handle );
		} else {
			this.eventListeners.set( type, [ handle ] );
		}
	}
	
	public clear( type?: keyof MetaData ) {
		if ( type ) {
			this.eventListeners.delete( type );
		} else {
			this.eventListeners.clear();
		}
	}
	
	public watchStart() {
		if ( this.watcher ) {
			return;
		}
		this.watcher = chokidar.watch( [ "meta" ], {
			cwd: path.resolve( __dirname, "../adachi-assets" )
		} )
		const eventList = <const>[ "add", "change", "unlink" ];
		eventList.forEach( event => {
			this.watcher!.on( event, async ( filePath: string ) => {
				const metaFile = this.getMetaFile( filePath );
				if ( !metaFile ) {
					return;
				}
				// 获取对应的数据获取函数
				this.metaData[metaFile] = await this.loadMeta( metaFile );
				
				if ( event !== "add" ) {
					this.logger.info( `miHoYo抽卡分析插件: 静态数据文件 [${ metaFile }] 内容更新` );
				}
			} )
		} )
	}
	
	public async watchClose() {
		if ( !this.watcher ) {
			return;
		}
		await this.watcher.close();
		this.watcher = null;
	}
	
	public getMeta<T extends keyof MetaData>( file: T ): MetaData[T] {
		return this.metaData[file] || [];
	}
	
	private getMetaFile( filePath: string ): keyof MetaData | null {
		filePath = filePath.split( "." )[0];
		const metaFile = <keyof MetaData>filePath.split( path.sep ).join( "/" );
		if ( !Reflect.has( this.MetaFunctionMap, metaFile ) ) {
			return null;
		}
		return metaFile;
	}
	
	/* 通用读取 meta 文件数据方法 */
	private async loadMeta( metaFile: keyof MetaData ) {
		const data = await this.file.loadYAML( `mihoyo-gacha/adachi-assets/${ metaFile }`, "plugin" );
		const handles = this.eventListeners.get( metaFile ) || [];
		// 执行注册的所有事件
		await Promise.all( handles.map( async handle => await handle( data ) ) );
		
		return this.MetaFunctionMap[metaFile].call( this, data );
	}
}