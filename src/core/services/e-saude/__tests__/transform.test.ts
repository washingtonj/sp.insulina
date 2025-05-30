import { describe, it, expect } from 'vitest';
import { fromGetAvailability } from '../transform';

describe('fromGetAvailability', () => {
	it('should transform API response to PickupEntity array', () => {
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
								medicamento: 'INSULINA HUMANA NPH 100 UI/ML SUSPENSÃO INJETÁVEL FAM 10 ML',
								quantidade: '18',
								nivelDisponibilidade: 'médio'
							}
						]
					}
				]
			}
		};

		const result = fromGetAvailability(mockApiResponse);

		expect(Array.isArray(result)).toBe(true);
		expect(result.length).toBe(1);

		const pickup = result[0];
		expect(pickup.name).toBe('UBS TESTE');
		expect(pickup.address.address).toBe('RUA TESTE, 123');
		expect(pickup.address.latitude).toBe(-23.5);
		expect(pickup.address.longitude).toBe(-46.4);
		expect(Array.isArray(pickup.availability)).toBe(true);
	});

	it('should correctly match CANETA type insulin', () => {
		const canetaApiResponse = {
			result: {
				disponibilidade: [
					{
						unidade: 'UBS TESTE',
						endereco: 'RUA TESTE, 1',
						coordenadas: { lat: 0, lng: 0 },
						quantidades: [
							{
								medicamento:
									'INSULINA HUMANA REGULAR 100 UI/ML SUSPENSÃO INJETÁVEL CANETA SISTEMA PREENCHIDO 3 ML',
								quantidade: '85',
								nivelDisponibilidade: 'alto'
							}
						]
					}
				]
			}
		};

		const result = fromGetAvailability(canetaApiResponse);
		const insulinAvailability = result[0].availability.find((a) => a.quantity > 0);

		expect(insulinAvailability?.insulin.type).toBe('CANETA');
		expect(insulinAvailability?.insulin.code).toBe('1106400904400910');
		expect(insulinAvailability?.quantity).toBe(85);
		expect(insulinAvailability?.level).toBe(3);
	});

	it('should correctly match AMPOLA type insulin', () => {
		const ampolaApiResponse = {
			result: {
				disponibilidade: [
					{
						unidade: 'UBS TESTE',
						endereco: 'RUA TESTE, 1',
						coordenadas: { lat: 0, lng: 0 },
						quantidades: [
							{
								medicamento: 'INSULINA HUMANA NPH 100 UI/ML SUSPENSÃO INJETÁVEL FAM 10 ML',
								quantidade: '50',
								nivelDisponibilidade: 'alto'
							}
						]
					}
				]
			}
		};

		const result = fromGetAvailability(ampolaApiResponse);
		const insulinAvailability = result[0].availability.find((a) => a.quantity > 0);

		expect(insulinAvailability?.insulin.type).toBe('AMPOLA');
		expect(insulinAvailability?.insulin.code).toBe('1106400904400049');
		expect(insulinAvailability?.quantity).toBe(50);
		expect(insulinAvailability?.level).toBe(3);
	});

	it('should correctly match REFILL type insulin', () => {
		const refillApiResponse = {
			result: {
				disponibilidade: [
					{
						unidade: 'UBS TESTE',
						endereco: 'RUA TESTE, 1',
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

		const result = fromGetAvailability(refillApiResponse);
		const insulinAvailability = result[0].availability.find((a) => a.quantity > 0);

		expect(insulinAvailability?.insulin.type).toBe('REFILL');
		expect(insulinAvailability?.insulin.code).toBe('1106400904401002');
		expect(insulinAvailability?.quantity).toBe(30);
		expect(insulinAvailability?.level).toBe(3);
	});

	it('should correctly map availability levels', () => {
		const apiResponse = {
			result: {
				disponibilidade: [
					{
						unidade: 'UBS TESTE',
						endereco: 'RUA TESTE, 1',
						coordenadas: { lat: 0, lng: 0 },
						quantidades: [
							{
								medicamento: 'INSULINA HUMANA NPH 100 UI/ML SUSPENSÃO INJETÁVEL FAM 10 ML',
								quantidade: '10',
								nivelDisponibilidade: 'baixo'
							},
							{
								medicamento: 'INSULINA HUMANA REGULAR 100 UI/ML SUSPENSÃO INJETÁVEL FAM 10 ML',
								quantidade: '20',
								nivelDisponibilidade: 'médio'
							}
						]
					}
				]
			}
		};

		const result = fromGetAvailability(apiResponse);
		const availableInsulins = result[0].availability.filter((a) => a.quantity > 0);

		const nphInsulin = availableInsulins.find((a) =>
			a.insulin.simpleName.includes('INSULINA HUMANA NPH')
		);
		const regularInsulin = availableInsulins.find((a) =>
			a.insulin.simpleName.includes('INSULINA HUMANA REGULAR')
		);

		expect(nphInsulin?.level).toBe(1); // baixo
		expect(regularInsulin?.level).toBe(2); // médio
		expect(nphInsulin?.quantity).toBe(10);
		expect(regularInsulin?.quantity).toBe(20);
	});

	it('should handle empty disponibilidade', () => {
		const emptyResponse = { result: { disponibilidade: [] } };
		const result = fromGetAvailability(emptyResponse);
		expect(result).toEqual([]);
	});

	it('should handle missing disponibilidade', () => {
		const invalidResponse = { result: {} };
		const result = fromGetAvailability(invalidResponse);
		expect(result).toEqual([]);
	});
});
