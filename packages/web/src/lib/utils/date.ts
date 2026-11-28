export function formatRelativeTime(isoDate: string, now = Date.now()): string {
	const minutes = Math.round((now - new Date(isoDate).getTime()) / 60_000);

	if (minutes < 1) return 'agora';
	if (minutes < 60) return `há ${minutes} min`;

	const hours = Math.round(minutes / 60);
	if (hours < 24) return `há ${hours} h`;

	return `há ${Math.round(hours / 24)} d`;
}

export function formatShortDay(day: string): string {
	return `${day.slice(8, 10)}/${day.slice(5, 7)}`;
}

const FULL_DATE = new Intl.DateTimeFormat('pt-BR', {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	timeZone: 'UTC'
});

export function formatFullDate(date: Date): string {
	return FULL_DATE.format(date);
}

export function formatAxisDate(date: Date): string {
	const day = String(date.getUTCDate()).padStart(2, '0');
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');

	return `${day}/${month}`;
}
