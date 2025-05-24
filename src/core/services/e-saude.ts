import type { AddressEntity } from '../entities/address';
import { InsulinEntity } from '../entities/insulin';
import { AvailabilityEntity } from '../entities/availability';
import { PickupPointEntity } from '../entities/pickup-point';

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
				const matchedInsulin = insulinsInfo.find((insulin) => insulin.name === item.medicamento);

				const insulin = new InsulinEntity({
					code: matchedInsulin ? matchedInsulin.code : '',
					name: item.medicamento
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
		return [
			{
				code: '1106400904401002',
				name: 'INSULINA HUMANA NPH 100 UI/ML CARPULE TUBETE SUSPENSÃO INJETÁVEL 3 ML'
			},
			{
				code: '1106400904401010',
				name: 'INSULINA HUMANA REGULAR 100 UI/ML CARPULE TUBETE SUSPENSÃO INJETÁVEL 3 ML'
			},
			{
				code: '1106400904400910',
				name: 'INSULINA HUMANA REGULAR 100 UI/ML- SUSPENSÃO INJETÁVEL CANETA SISTEMA PREENCHIDO 3 ML'
			},
			{
				code: '1106400904400057',
				name: 'INSULINA HUMANA REGULAR 100 UI/ML SUSPENSÃO INJETÁVEL FAM 10 ML'
			},
			{
				code: '1106400904400901',
				name: 'INSULINA HUMANA NPH 100 UI/ML SUSPENSÃO INJETÁVEL CANETA SISTEMA PREENCHIDO 3 ML'
			},
			{
				code: '1106400904400049',
				name: 'INSULINA HUMANA NPH 100 UI/ML SUSPENSÃO INJETÁVEL FAM 10 ML'
			}
		] as InsulinEntity[];
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
						name: insulin.name
					})),
					coordenadas: {
						lat: address.latitude,
						lng: address.longitude
					},
					endereco: address.address
				}
			})
		});

		if (!request.ok) {
			console.error(`Error fetching availability: ${request.statusText}`);
		}
		const response = await request.json();
		const transformedResponse = ESaudeTransform.transformAvailabilityResponse(response, insulins);

		return transformedResponse;
	}
}
