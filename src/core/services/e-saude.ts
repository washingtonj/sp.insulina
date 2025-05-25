import type { AddressEntity } from '../entities/address';
import { InsulinEntity } from '../entities/insulin';
import { AvailabilityEntity } from '../entities/availability';
import { PickupPointEntity } from '../entities/pickup-point';

const STATIC_INSULINS = [
	{
		code: '1106400904401002',
		fullName: 'INSULINA HUMANA NPH 100 UI/ML CARPULE TUBETE SUSPENSÃO INJETÁVEL 3 ML',
		simpleName: 'INSULINA HUMANA NPH 100 UI/ML',
		type: 'REFILL'
	},
	{
		code: '1106400904401010',
		fullName: 'INSULINA HUMANA REGULAR 100 UI/ML CARPULE TUBETE SUSPENSÃO INJETÁVEL 3 ML',
		simpleName: 'INSULINA HUMANA REGULAR 100 UI/ML',
		type: 'REFILL'
	},
	{
		code: '1106400904400910',
		fullName:
			'INSULINA HUMANA REGULAR 100 UI/ML SUSPENSÃO INJETÁVEL CANETA SISTEMA PREENCHIDO 3 ML',
		simpleName: 'INSULINA HUMANA REGULAR 100 UI/ML',
		type: 'CANETA'
	},
	{
		code: '1106400904400057',
		fullName: 'INSULINA HUMANA REGULAR 100 UI/ML SUSPENSÃO INJETÁVEL FAM 10 ML',
		simpleName: 'INSULINA HUMANA REGULAR 100 UI/ML',
		type: 'AMPOLA'
	},
	{
		code: '1106400904400901',
		fullName: 'INSULINA HUMANA NPH 100 UI/ML SUSPENSÃO INJETÁVEL CANETA SISTEMA PREENCHIDO 3 ML',
		simpleName: 'INSULINA HUMANA NPH 100 UI/ML',
		type: 'CANETA'
	},
	{
		code: '1106400904400049',
		fullName: 'INSULINA HUMANA NPH 100 UI/ML SUSPENSÃO INJETÁVEL FAM 10 ML',
		simpleName: 'INSULINA HUMANA NPH 100 UI/ML',
		type: 'AMPOLA'
	}
] as InsulinEntity[];

/* eslint-disable @typescript-eslint/no-explicit-any */
class ESaudeTransform {
	private constructor() {}

	static transformAvailabilityResponse(
		apiResponse: any,
		insulinsInfo: InsulinEntity[]
	): AvailabilityEntity[] {
		const disponibilidade = apiResponse?.result?.disponibilidade;
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

			const quantity = (unit.quantidades || []).map((item: any) => {
				// Try to match insulin by name from the static list, fallback to name only
				const removeAccents = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
				const normalize = (str: string) =>
					removeAccents(str)
						.replace(/\s+/g, ' ')
						.replace(/[^a-zA-Z0-9]/g, '')
						.toLowerCase()
						.trim();

				const normalizedMedicamento = normalize(item.medicamento);

				const typeHeuristics: Record<string, (name: string) => boolean> = {
					CANETA: (name) => name.includes('preenchido'),
					AMPOLA: (name) => name.includes('fam10ml'),
					REFILL: (name) => name.includes('carpule') || name.includes('tubete')
				};

				const matchedInsulin = insulinsInfo.find((insulin) => {
					const normalizedInsulinName = normalize(insulin.fullName);
					const normalizedInsulinSimple = normalize(insulin.simpleName);
					const insulinType = insulin.type;
					const typeHeuristic = typeHeuristics[insulinType];

					const typeMatch = typeHeuristic ? typeHeuristic(normalizedMedicamento) : false;

					// Stricter: require both type and simpleName to match
					const simpleNameMatch = normalizedMedicamento.includes(normalizedInsulinSimple);

					return (
						(normalizedInsulinName.includes(normalizedMedicamento) ||
							normalizedMedicamento.includes(normalizedInsulinName) ||
							typeMatch) &&
						simpleNameMatch
					);
				});

				const insulin = new InsulinEntity({
					code: matchedInsulin ? matchedInsulin.code : '',
					fullName: item.medicamento,
					simpleName: matchedInsulin ? matchedInsulin.simpleName : '',
					type: matchedInsulin ? matchedInsulin.type : (undefined as any)
				});

				// Map API level to numeric: alto=3, medio=2, baixo=1
				let level: 1 | 2 | 3 = 2;
				if (item.nivelDisponibilidade === 'alto') level = 3;
				else if (item.nivelDisponibilidade === 'baixo') level = 1;

				return {
					insulin,
					quantity: Number(item.quantidade),
					level
				};
			});

			return new AvailabilityEntity({
				pickup,
				quantity
			});
		});
	}
}

/* eslint-enable @typescript-eslint/no-explicit-any */
export class ESaudeService {
	private readonly baseUrl: string = 'https://southamerica-east1-mobile-testes.cloudfunctions.net';

	getInsulinsInfo() {
		return STATIC_INSULINS;
	}

	async getAvailability(insulins: InsulinEntity[], address: AddressEntity) {
		const request = await fetch(`${this.baseUrl}/disponilidadesParaMedicamentos`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				data: {
					medicamentos: insulins.map((insulin) => ({
						id: insulin.code,
						name: insulin.fullName
					})),
					coordenadas: {
						lat: address.latitude,
						lng: address.longitude
					},
					endereco: address.address
				}
			})
		});

		const response = await request.json();
		const transformedResponse = ESaudeTransform.transformAvailabilityResponse(response, insulins);

		return transformedResponse;
	}
}
