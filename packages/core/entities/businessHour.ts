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

export const DayAbbreviations: Record<DayOfWeek, string> = {
	0: 'Dom',
	1: 'Seg',
	2: 'Ter',
	3: 'Qua',
	4: 'Qui',
	5: 'Sex',
	6: 'Sáb'
};

export function has24hService(businessHours: BusinessHourEntity[]): boolean {
	const openDays = businessHours.filter((day) => day.isOpen);
	if (openDays.length !== 7) return false;

	return openDays.every((day) => day.hours[0] === '00:00' && day.hours[1] === '23:59');
}

export function hasWeekendService(businessHours: BusinessHourEntity[]): boolean {
	return businessHours.some((day) => day.isOpen && (day.dayOfWeek === 0 || day.dayOfWeek === 6));
}

export function hasWeekdayService(businessHours: BusinessHourEntity[]): boolean {
	return businessHours.some((day) => day.isOpen && day.dayOfWeek >= 1 && day.dayOfWeek <= 5);
}
