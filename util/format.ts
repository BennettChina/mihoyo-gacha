/**
 * 转化 Object 类型的数据为 redis 支持的类型
 * @param obj {Record<string,any>} data
 */
export function transformObj( obj: Record<string, any> ): Record<string, string | number> {
	const data = {};
	Object.entries( obj ).forEach( ( [ key, value ] ) => {
		if ( value === null ) return;
		switch ( typeof value ) {
			case 'object':
				data[key] = JSON.stringify( value );
				break;
			case 'string':
				data[key] = value;
				break;
			case 'number':
				data[key] = value;
				break;
			case 'boolean':
				data[key] = `${ value }`;
				break;
			case 'bigint':
				data[key] = `${ value }`;
				break;
			case 'symbol':
				data[key] = `${ value.description }`;
				break;
			case 'undefined':
				data[key] = `${ value }`;
				break;
			default:
				break;
		}
	} )
	return data;
}

export function transformCookie( cookie: string ): Record<string, string>;

export function transformCookie( cookie: Record<string, string> ): string;

export function transformCookie( cookie: string | Record<string, string> ): Record<string, string> | string {
	if ( typeof cookie === "string" ) {
		return decodeURIComponent( cookie ).split( ";" )
			.filter( item => !!item && item.trim().length > 0 )
			.reduce( ( acc, item ) => {
				const delimiter = item.indexOf( '=' );
				const key = item.substring( 0, delimiter ).trim();
				acc[key] = item.substring( delimiter + 1 ).trim();
				return acc;
			}, {} );
	}
	return Object.entries( cookie )
		.map( ( [ k, v ] ) => {
			return `${ k }=${ v }`;
		} )
		.join( ";" );
}

/**
 * 数字转中文数字
 * @param num 数字
 */
export function numberToChinese( num: number ): string {
	if ( num === 2 ) return "两";
	const chineseNumbers = [ "零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十" ];
	if ( num <= 10 ) {
		return chineseNumbers[num];
	} else if ( num < 20 ) {
		return "十" + chineseNumbers[num - 10];
	} else if ( num < 100 ) {
		const tens = Math.floor( num / 10 );
		const ones = num % 10;
		return chineseNumbers[tens] + "十" + ( ones > 0 ? chineseNumbers[ones] : "" );
	} else {
		return num.toString(); // 超过100直接返回数字
	}
}