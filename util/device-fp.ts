import { getRandomNumber, getRandomStringBySeed } from "@/utils/random";

export function getMiHoYoUuid(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
		.replace( /[xy]/g, el => {
			const r: number = Math.random() * 16 | 0;
			const v: number = el == "x" ? r : ( r & 0x3 | 0x8 );
			return v.toString( 16 );
		} );
}

export function deviceFp(): string {
	const seed = '0123456789';
	return getRandomStringBySeed( 10, seed );
}

export function getMiHoYoRandomStr( length: number ): string {
	const seed = '0123456789abcdef';
	return getRandomStringBySeed( length, seed );
}

export function batteryStatus(): number {
	const max = 100, min = 1;
	return getRandomNumber( min, max );
}

/**
 * 生成一组加速计数值
 */
export function accelerometer(): number[] {
	const x = ( Math.random() - 0.5 ) * 2;
	const y = ( Math.random() - 0.5 ) * 2;
	const z = ( Math.random() - 0.5 ) * 2;
	return [ x, y, z ];
}

export function magnetometer() {
	// -90 到 90 的随机值
	const range = 180;
	const length = 3;
	return Array.from( { length }, () => {
		return Math.random() * range - range / 2;
	} );
}

export function getPlugins( size: number ): string[] {
	const plugins = [
		"PDF Viewer",
		"Chrome PDF Viewer",
		"Chromium PDF Viewer",
		"Microsoft Edge PDF Viewer",
		"WebKit built-in PDF"
	]
	
	if ( size >= plugins.length ) {
		return plugins;
	}
	return plugins.slice( 0, size - plugins.length );
}

/**
 * 随机产生一个偶数
 * @param min {number} 最小值
 * @param max {number} 最大值
 * @return {number} 偶数
 */
export function randomEvenNum( min: number, max: number ): number {
	// 确保范围内至少有一个偶数
	if ( min % 2 !== 0 ) {
		min += 1;
	}
	if ( max % 2 !== 0 ) {
		max -= 1;
	}
	// 如果调整后min大于max，说明范围内没有偶数
	if ( min > max ) {
		throw new Error( 'No even numbers in the given range.' );
	}
	
	// 随机生成一个偶数
	const range = ( max - min ) / 2 + 1;
	return min + 2 * Math.floor( Math.random() * range );
}