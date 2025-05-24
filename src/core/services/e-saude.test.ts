import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ESaudeService } from './e-saude';
import { InsulinEntity } from '../entities/insulin';
import { AddressEntity } from '../entities/address';
import { AvailabilityEntity } from '../entities/availability';

const mockApiResponse = {
	result: {
		disponibilidade: [
			{
				distance: 100,
				cor: '#166D78',
				unidade: 'UBS TESTE',
				endereco: 'RUA TESTE, 123',
				expediente: 'Seg a Sex: 07:00 até 19:00.',
				coordenadas: {
					lat: -23.5,
					lng: -46.4
				},
				quantidades: [
					{
						medicamento: 'INSULINA HUMANA NPH 100 UI/ML SUSPENSAO INJETAVEL FAM 10     ML',
						quantidade: '18',
						cor: '#FFA500',
						mensagens: [],
						nivelDisponibilidade: 'médio'
					}
				]
			}
		]
	}
};

const mockInsulins = [
	new InsulinEntity({
		code: '1106400904400049',
		name: 'INSULINA HUMANA NPH 100 UI/ML SUSPENSAO INJETAVEL FAM 10     ML'
	}),
	new InsulinEntity({
		code: '1106400904400057',
		name: 'INSULINA HUMANA REGULAR 100 UI/ML SUSPENSÃO INJETÁVEL FAM 10 ML'
	})
];

const mockAddress = new AddressEntity({
	address: 'RUA TESTE, 123',
	latitude: -23.5,
	longitude: -46.4
});

describe('ESaudeService', () => {
	let service: ESaudeService;
	// @ts-expect-error - global.fetch is not defined in the type
	let fetchSpy: ReturnType<typeof vi.spyOn<typeof global, 'fetch'>>;

	beforeEach(() => {
		service = new ESaudeService();
		fetchSpy = vi.spyOn(global, 'fetch');
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('getInsulinsInfo should return the static list of insulins', () => {
		const insulins = service.getInsulinsInfo();
		expect(Array.isArray(insulins)).toBe(true);
		expect(insulins.length).toBeGreaterThan(0);
		expect(insulins[0]).toHaveProperty('code');
		expect(insulins[0]).toHaveProperty('name');
	});

	it('getAvailability should POST to the correct endpoint and transform the response', async () => {
		fetchSpy.mockResolvedValueOnce({
			json: async () => mockApiResponse
		} as unknown as Response);

		const result = await service.getAvailability(mockInsulins, mockAddress);

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [url, options] = fetchSpy.mock.calls[0];
		expect(url).toContain('/disponilidadesParaMedicamentos');
		expect(options!.method).toBe('POST');
		// @ts-expect-error - options is not defined in the type
		expect(options!.headers?.['Content-Type']).toBe('application/json');
		// @ts-expect-error - options is not defined in the type
		const body = JSON.parse(options!.body);
		expect(body.data.medicamentos).toEqual(
			mockInsulins.map(insulin => ({
				id: insulin.code,
				name: insulin.name
			}))
		);
		expect(body.data.coordenadas.lat).toBe(mockAddress.latitude);
		expect(body.data.coordenadas.lng).toBe(mockAddress.longitude);
		expect(body.data.endereco).toBe(mockAddress.address);

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(1);
		const availability = result[0];
		expect(availability).toBeInstanceOf(AvailabilityEntity);
		expect(availability.pickup.placeName).toBe('UBS TESTE');
		expect(availability.pickup.address.address).toBe('RUA TESTE, 123');
		expect(availability.quantity[0].insulin.name).toBe(
			'INSULINA HUMANA NPH 100 UI/ML SUSPENSAO INJETAVEL FAM 10     ML'
		);
		expect(availability.quantity[0].insulin.code).toBe('1106400904400049');
		expect(availability.quantity[0].quantity).toBe(18);
		expect(availability.quantity[0].level).toBe(2);
	});

	it('getAvailability should handle empty disponibilidade gracefully', async () => {
		fetchSpy.mockResolvedValueOnce({
			json: async () => ({ result: { disponibilidade: [] } })
		} as unknown as Response);

		const result = await service.getAvailability(mockInsulins, mockAddress);
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(0);
	});

	it('getAvailability should handle missing disponibilidade gracefully', async () => {
		fetchSpy.mockResolvedValueOnce({
			json: async () => ({ result: { disponibilidade: undefined } })
		} as unknown as Response);

		const result = await service.getAvailability(mockInsulins, mockAddress);
		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(0);
	});

	it('getAvailability should set insulin code to empty string if not found in insulins', async () => {
		fetchSpy.mockResolvedValueOnce({
			json: async () => ({
				result: {
					disponibilidade: [
						{
							unidade: 'UBS UNKNOWN',
							endereco: 'RUA UNKNOWN, 1',
							coordenadas: { lat: 0, lng: 0 },
							quantidades: [
								{ medicamento: 'UNKNOWN INSULIN', quantidade: '5', nivelDisponibilidade: 'alto' }
							]
						}
					]
				}
			})
		} as unknown as Response);

		const result = await service.getAvailability([], mockAddress);
		expect(result[0].quantity[0].insulin.code).toBe('');
		expect(result[0].quantity[0].insulin.name).toBe('UNKNOWN INSULIN');
		expect(result[0].quantity[0].level).toBe(3);
	});
});
