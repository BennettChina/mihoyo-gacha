export interface MiHoYoGame {
	gameId: number;
	gameName: string;
	uid: string;
	nickname: string;
	region: string;
	level: number;
	regionName: string;
}

export type DeviceData = {
	userAgent: string;
	deviceId: string;
	deviceFp: string;
	lifecycleId: string;
	seedId: string;
	seedTime: string;
}

export interface MiHoYoAccount {
	userId: number;
	uid: number;
	cookie: string;
	games: MiHoYoGame[];
	deviceData: DeviceData;
}