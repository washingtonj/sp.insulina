<script lang="ts">
	import type { InsulinEntity } from '$core/entities/insulin';
	import type { PickupEntity } from '$core/entities/pickup';
	import type { BusinessHourEntity } from '$core/entities/businessHour';

	// Day abbreviations for compact display
	const DayAbbreviations: Record<number, string> = {
		0: 'Dom',
		1: 'Seg',
		2: 'Ter',
		3: 'Qua',
		4: 'Qui',
		5: 'Sex',
		6: 'Sáb'
	};

	// Business hours display types
	type BusinessHoursDisplay = {
		is24h: boolean;
		weekdays: string | null;
		weekend: string | null;
		other: string | null;
	};

	type Props = {
		requestedInsulins?: InsulinEntity[];
	} & PickupEntity;

	let {
		name,
		address,
		availability = [],
		requestedInsulins = [],
		businessHours = []
	}: Props = $props();

	const selectedInsulins = $derived(
		availability.filter((q) => requestedInsulins.find((i) => i.code === q.insulin.code))
	);

	const otherInsulins = $derived(
		availability.filter((q) => !requestedInsulins.find((i) => i.code === q.insulin.code))
	);

	// Group hours by time pattern
	function groupDaysByHours(days: BusinessHourEntity[]): Map<string, BusinessHourEntity[]> {
		const groupedMap = new Map<string, BusinessHourEntity[]>();
		days.forEach((day) => {
			const key = `${day.hours[0]}-${day.hours[1]}`;
			if (!groupedMap.has(key)) {
				groupedMap.set(key, []);
			}
			groupedMap.get(key)!.push(day);
		});
		return groupedMap;
	}

	// Get consecutive days range
	function getConsecutiveDaysRange(days: BusinessHourEntity[]): string {
		const sortedDays = [...days].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
		if (sortedDays.length === 1) {
			return DayAbbreviations[sortedDays[0].dayOfWeek];
		}

		// Special case for weekend
		if (
			sortedDays.length === 2 &&
			sortedDays.some((d) => d.dayOfWeek === 0) &&
			sortedDays.some((d) => d.dayOfWeek === 6)
		) {
			return 'Sáb e Dom';
		}

		return `${DayAbbreviations[sortedDays[0].dayOfWeek]} a ${DayAbbreviations[sortedDays[sortedDays.length - 1].dayOfWeek]}`;
	}

	function getBusinessHoursDisplay(businessHours: BusinessHourEntity[]): BusinessHoursDisplay {
		const result: BusinessHoursDisplay = {
			is24h: false,
			weekdays: null,
			weekend: null,
			other: null
		};

		const openDays = businessHours.filter((day) => day.isOpen);
		if (openDays.length === 0) {
			result.other = 'Fechado';
			return result;
		}

		// Check if all days are open with the same hours (24h case)
		if (openDays.length === 7) {
			const firstHours = openDays[0].hours;
			const allSameHours = openDays.every(
				(day) => day.hours[0] === firstHours[0] && day.hours[1] === firstHours[1]
			);

			if (allSameHours && firstHours[0] === '00:00' && firstHours[1] === '23:59') {
				result.is24h = true;
				return result;
			}

			if (allSameHours) {
				result.weekdays = `Todos dias ${firstHours[0]}-${firstHours[1]}`;
				return result;
			}
		}

		// Separate weekdays and weekend
		const weekdays = openDays.filter((day) => day.dayOfWeek >= 1 && day.dayOfWeek <= 5);
		const weekend = openDays.filter((day) => day.dayOfWeek === 0 || day.dayOfWeek === 6);

		// Process weekdays
		if (weekdays.length > 0) {
			if (weekdays.length === 5) {
				const firstWeekdayHours = weekdays[0].hours;
				const allWeekdaySameHours = weekdays.every(
					(day) => day.hours[0] === firstWeekdayHours[0] && day.hours[1] === firstWeekdayHours[1]
				);

				if (allWeekdaySameHours) {
					result.weekdays = `Seg a Sex ${firstWeekdayHours[0]}-${firstWeekdayHours[1]}`;
				} else {
					// Group weekdays by hours
					const groupedWeekdays = groupDaysByHours(weekdays);
					const formattedGroups: string[] = [];

					groupedWeekdays.forEach((days, hoursKey) => {
						const [openHour, closeHour] = hoursKey.split('-');
						const daysRange = getConsecutiveDaysRange(days);
						formattedGroups.push(`${daysRange} ${openHour}-${closeHour}`);
					});

					result.weekdays = formattedGroups.join(', ');
				}
			} else {
				// Some weekdays but not all
				const formattedDays = weekdays
					.map((day) => {
						return `${DayAbbreviations[day.dayOfWeek]} ${day.hours[0]}-${day.hours[1]}`;
					})
					.join(', ');
				result.weekdays = formattedDays;
			}
		}

		// Process weekend
		if (weekend.length > 0) {
			if (weekend.length === 2) {
				const firstWeekendHours = weekend[0].hours;
				const secondWeekendHours = weekend[1].hours;

				if (
					firstWeekendHours[0] === secondWeekendHours[0] &&
					firstWeekendHours[1] === secondWeekendHours[1]
				) {
					// Same hours for both weekend days
					result.weekend = `Sáb e Dom ${firstWeekendHours[0]}-${firstWeekendHours[1]}`;
				} else {
					// Different hours for weekend days
					const satDay = weekend.find((d) => d.dayOfWeek === 6);
					const sunDay = weekend.find((d) => d.dayOfWeek === 0);

					const parts: string[] = [];
					if (satDay) parts.push(`Sáb ${satDay.hours[0]}-${satDay.hours[1]}`);
					if (sunDay) parts.push(`Dom ${sunDay.hours[0]}-${sunDay.hours[1]}`);

					result.weekend = parts.join(', ');
				}
			} else if (weekend.length === 1) {
				// Only one weekend day
				const day = weekend[0];
				result.weekend = `${DayAbbreviations[day.dayOfWeek]} ${day.hours[0]}-${day.hours[1]}`;
			}
		}

		return result;
	}

	const businessHoursDisplay = $derived(getBusinessHoursDisplay(businessHours));
	const has24hService = $derived(businessHoursDisplay.is24h);
</script>

<li class="m-0 flex flex-col space-y-4 rounded-lg border border-gray-200 px-6 py-4">
	<span>
		<h3 class="text-xl font-bold">{name}</h3>
		<p class="text-sm text-gray-500">{address.address}</p>
		{#if address.distance}
			<p class="mt-1 text-xs text-blue-600">{address.distance.toFixed(1)} km de distância</p>
		{/if}
		<div class="mt-2 flex gap-1">
			{#if has24hService}
				<p class="w-fit rounded-lg bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
					Aberto 24h
				</p>
			{:else}
				{#each [businessHoursDisplay.weekdays, businessHoursDisplay.weekend, businessHoursDisplay.other].filter(Boolean) as displayText (displayText)}
					<p class="w-fit rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600">
						{displayText}
					</p>
				{/each}
			{/if}
		</div>
	</span>

	{#if selectedInsulins.length > 0}
		<div>
			<div class="mb-1 text-xs font-semibold text-gray-700">Insulinas Selecionadas</div>
			<div class="text-sm">
				{#each selectedInsulins as { insulin, level, quantity } (insulin.code)}
					<span class="mb-1 flex items-center space-x-2">
						<p
							class={level === 1
								? 'text-red-600'
								: level === 2
									? 'text-yellow-500'
									: level === 3
										? 'text-green-600'
										: ''}
						>
							{quantity}x
						</p>
						<p>
							{insulin.type} - {insulin.simpleName}
						</p>
						<span class="ml-2 text-xs text-gray-400">Nível {level}</span>
					</span>
				{/each}
			</div>
		</div>
	{/if}

	{#if otherInsulins.length > 0}
		<div class="mt-2">
			<div class="mb-1 text-xs font-semibold text-gray-400">Outras Insulinas Disponíveis</div>
			<div class="text-sm">
				{#each otherInsulins as { insulin, level, quantity } (insulin.code)}
					<span class="mb-1 flex items-center space-x-2 opacity-70">
						<p
							class={level === 1
								? 'text-red-600'
								: level === 2
									? 'text-yellow-500'
									: level === 3
										? 'text-green-600'
										: ''}
						>
							{quantity}x
						</p>
						<p>
							{insulin.type} - {insulin.simpleName}
						</p>
						<span class="ml-2 text-xs text-gray-400">Nível {level}</span>
					</span>
				{/each}
			</div>
		</div>
	{/if}
</li>
