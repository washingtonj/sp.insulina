import { InsulinEntity } from '$core/entities/insulin';
import { AvailabilityEntity } from '$core/entities/availability';
import { PickupPointEntity } from '$core/entities/pickup-point';
import { STATIC_INSULINS } from './consts';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function fromGetAvailability(response: any): AvailabilityEntity[] {
	const disponibilidade = response?.result?.disponibilidade;

	if (!Array.isArray(disponibilidade)) {
		return [];
	}

	return disponibilidade.map((unit: any) => {
		const pickup = new PickupPointEntity({
			placeName: unit.unidade,
			address: {
				address: unit.endereco,
				latitude: unit.coordenadas?.lat,
				longitude: unit.coordenadas?.lng
			}
		});

		const removeAccents = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		const normalize = (str: string) =>
			removeAccents(str)
				.replace(/\s+/g, ' ')
				.replace(/[^a-zA-Z0-9]/g, '')
				.toLowerCase()
				.trim();

		const typeHeuristics: Record<string, (name: string) => boolean> = {
			CANETA: (name) => name.includes('preenchido'),
			AMPOLA: (name) => name.includes('fam10ml'),
			REFILL: (name) => name.includes('carpule') || name.includes('tubete')
		};

		const foundInsulins: Record<string, { quantity: number; level: 1 | 2 | 3 }> = {};

		for (const item of unit.quantidades || []) {
			const normalizedMedicamento = normalize(item.medicamento);

			const matchedInsulin = STATIC_INSULINS.find((insulin) => {
				const normalizedInsulinName = normalize(insulin.fullName);
				const normalizedInsulinSimple = normalize(insulin.simpleName);
				const insulinType = insulin.type;
				const typeHeuristic = typeHeuristics[insulinType];

				const typeMatch = typeHeuristic ? typeHeuristic(normalizedMedicamento) : false;
				const simpleNameMatch = normalizedMedicamento.includes(normalizedInsulinSimple);

				return (
					(normalizedInsulinName.includes(normalizedMedicamento) ||
						normalizedMedicamento.includes(normalizedInsulinName) ||
						typeMatch) &&
					simpleNameMatch
				);
			});

			if (matchedInsulin) {
				let level: 1 | 2 | 3 = 2;
				if (item.nivelDisponibilidade === 'alto') level = 3;
				else if (item.nivelDisponibilidade === 'baixo') level = 1;

				foundInsulins[matchedInsulin.code] = {
					quantity: Number(item.quantidade),
					level
				};
			}
		}

		const quantity = STATIC_INSULINS.map((insulin) => {
			const found = foundInsulins[insulin.code];
			return {
				insulin: new InsulinEntity({
					code: insulin.code,
					fullName: insulin.fullName,
					simpleName: insulin.simpleName,
					type: insulin.type
				}),
				quantity: found ? found.quantity : 0,
				level: found ? found.level : 1 // Default to lowest level if not found
			};
		});

		return new AvailabilityEntity({
			pickup,
			quantity
		});
	});
}
