export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface BusinessHourEntity {
	dayOfWeek: DayOfWeek;
	hours: [string, string]; // [openTime, closeTime] in 24h format
	isOpen?: boolean;
}

export const DayNames: Record<DayOfWeek, string> = {
	0: 'Domingo',
	1: 'Segunda',
	2: 'Terça',
	3: 'Quarta',
	4: 'Quinta',
	5: 'Sexta',
	6: 'Sábado'
};
