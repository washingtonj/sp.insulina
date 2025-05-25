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
		fullName: 'INSULINA HUMANA NPH 100 UI/ML SUSPENSAO INJETAVEL FAM 10     ML',
		simpleName: 'INSULINA HUMANA NPH 100 UI/ML',
		type: 'AMPOLA'
	}),
	new InsulinEntity({
		code: '1106400904400057',
		fullName: 'INSULINA HUMANA REGULAR 100 UI/ML SUSPENSÃO INJETÁVEL FAM 10 ML',
		simpleName: 'INSULINA HUMANA REGULAR 100 UI/ML',
		type: 'AMPOLA'
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
		expect(insulins[0]).toHaveProperty('fullName');
		expect(insulins[0]).toHaveProperty('simpleName');
		expect(insulins[0]).toHaveProperty('type');
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
			mockInsulins.map((insulin) => ({
				id: insulin.code,
				name: insulin.fullName
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
		expect(availability.quantity[0].insulin.fullName).toBe(
			'INSULINA HUMANA NPH 100 UI/ML SUSPENSAO INJETAVEL FAM 10     ML'
		);
		expect(availability.quantity[0].insulin.code).toBe('1106400904400049');
		expect(availability.quantity[0].insulin.type).toBe('AMPOLA');
		expect(availability.quantity[0].quantity).toBe(18);
		expect(availability.quantity[0].level).toBe(2);
	});

	it('should match CANETA insulin type correctly', async () => {
		const canetaApiResponse = {
			result: {
				disponibilidade: [
					{
						unidade: 'UBS CANETA',
						endereco: 'RUA CANETA, 1',
						coordenadas: { lat: 0, lng: 0 },
						quantidades: [
							{
								medicamento:
									'INSULINA HUMANA REGULAR 100 UI/ML - SUSPENSAO INJETAVEL EM SISTEMA DE APLICACAO PREENCHIDO 3 ML',
								quantidade: '85',
								nivelDisponibilidade: 'alto'
							}
						]
					}
				]
			}
		};
		const canetaInsulins = [
			new InsulinEntity({
				code: '1106400904400910',
				fullName:
					'INSULINA HUMANA REGULAR 100 UI/ML- SUSPENSÃO INJETÁVEL CANETA SISTEMA PREENCHIDO 3 ML',
				simpleName: 'INSULINA HUMANA REGULAR 100 UI/ML',
				type: 'CANETA'
			})
		];
		fetchSpy.mockResolvedValueOnce({
			json: async () => canetaApiResponse
		} as unknown as Response);

		const result = await service.getAvailability(canetaInsulins, mockAddress);
		expect(result[0].quantity[0].insulin.type).toBe('CANETA');
		expect(result[0].quantity[0].insulin.code).toBe('1106400904400910');
	});

	it('should match AMPOLA insulin type correctly', async () => {
		const ampolaApiResponse = {
			result: {
				disponibilidade: [
					{
						unidade: 'UBS AMPOLA',
						endereco: 'RUA AMPOLA, 1',
						coordenadas: { lat: 0, lng: 0 },
						quantidades: [
							{
								medicamento: 'INSULINA HUMANA NPH 100 UI/ML SUSPENSAO INJETAVEL FAM 10 ML',
								quantidade: '50',
								nivelDisponibilidade: 'alto'
							}
						]
					}
				]
			}
		};
		const ampolaInsulins = [
			new InsulinEntity({
				code: '1106400904400049',
				fullName: 'INSULINA HUMANA NPH 100 UI/ML SUSPENSAO INJETAVEL FAM 10 ML',
				simpleName: 'INSULINA HUMANA NPH 100 UI/ML',
				type: 'AMPOLA'
			})
		];
		fetchSpy.mockResolvedValueOnce({
			json: async () => ampolaApiResponse
		} as unknown as Response);

		const result = await service.getAvailability(ampolaInsulins, mockAddress);
		expect(result[0].quantity[0].insulin.type).toBe('AMPOLA');
		expect(result[0].quantity[0].insulin.code).toBe('1106400904400049');
	});

	it('should match REFILL insulin type correctly', async () => {
		const refillApiResponse = {
			result: {
				disponibilidade: [
					{
						unidade: 'UBS REFILL',
						endereco: 'RUA REFILL, 1',
						coordenadas: { lat: 0, lng: 0 },
						quantidades: [
							{
								medicamento:
									'INSULINA HUMANA NPH 100 UI/ML CARPULE TUBETE SUSPENSÃO INJETÁVEL 3 ML',
								quantidade: '30',
								nivelDisponibilidade: 'alto'
							}
						]
					}
				]
			}
		};
		const refillInsulins = [
			new InsulinEntity({
				code: '1106400904401002',
				fullName: 'INSULINA HUMANA NPH 100 UI/ML CARPULE TUBETE SUSPENSÃO INJETÁVEL 3 ML',
				simpleName: 'INSULINA HUMANA NPH 100 UI/ML',
				type: 'REFILL'
			})
		];
		fetchSpy.mockResolvedValueOnce({
			json: async () => refillApiResponse
		} as unknown as Response);

		const result = await service.getAvailability(refillInsulins, mockAddress);
		expect(result[0].quantity[0].insulin.type).toBe('REFILL');
		expect(result[0].quantity[0].insulin.code).toBe('1106400904401002');
	});

	it('should not mismatch NPH and REGULAR insulins', async () => {
		const nphApiResponse = {
			result: {
				disponibilidade: [
					{
						unidade: 'UBS NPH',
						endereco: 'RUA NPH, 1',
						coordenadas: { lat: 0, lng: 0 },
						quantidades: [
							{
								medicamento: 'INSULINA HUMANA NPH 100 UI/ML SUSPENSAO INJETAVEL FAM 10 ML',
								quantidade: '10',
								nivelDisponibilidade: 'alto'
							}
						]
					}
				]
			}
		};
		const insulins = [
			new InsulinEntity({
				code: '1106400904400049',
				fullName: 'INSULINA HUMANA NPH 100 UI/ML SUSPENSAO INJETAVEL FAM 10 ML',
				simpleName: 'INSULINA HUMANA NPH 100 UI/ML',
				type: 'AMPOLA'
			}),
			new InsulinEntity({
				code: '1106400904400057',
				fullName: 'INSULINA HUMANA REGULAR 100 UI/ML SUSPENSÃO INJETÁVEL FAM 10 ML',
				simpleName: 'INSULINA HUMANA REGULAR 100 UI/ML',
				type: 'AMPOLA'
			})
		];
		fetchSpy.mockResolvedValueOnce({
			json: async () => nphApiResponse
		} as unknown as Response);

		const result = await service.getAvailability(insulins, mockAddress);
		expect(result[0].quantity[0].insulin.type).toBe('AMPOLA');
		expect(result[0].quantity[0].insulin.code).toBe('1106400904400049');
		expect(result[0].quantity[0].insulin.fullName).toContain('NPH');
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
		expect(result[0].quantity[0].insulin.fullName).toBe('UNKNOWN INSULIN');
		expect(result[0].quantity[0].level).toBe(3);
	});
});
