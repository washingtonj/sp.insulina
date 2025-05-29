import { describe, it, expect } from 'vitest';
import { fromGetAvailability } from '../transform';
import { AvailabilityEntity } from '$core/entities/availability';

describe('fromGetAvailability', () => {
	it('should transform API response to AvailabilityEntity array', () => {
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
		expect(result[0]).toBeInstanceOf(AvailabilityEntity);

		const availability = result[0];
		expect(availability.pickup.placeName).toBe('UBS TESTE');
		expect(availability.pickup.address.address).toBe('RUA TESTE, 123');
		expect(availability.pickup.address.latitude).toBe(-23.5);
		expect(availability.pickup.address.longitude).toBe(-46.4);
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
		const insulin = result[0].quantity.find((q) => q.quantity > 0)?.insulin;

		expect(insulin?.type).toBe('CANETA');
		expect(insulin?.code).toBe('1106400904400910');
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
		const insulin = result[0].quantity.find((q) => q.quantity > 0)?.insulin;

		expect(insulin?.type).toBe('AMPOLA');
		expect(insulin?.code).toBe('1106400904400049');
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
		const insulin = result[0].quantity.find((q) => q.quantity > 0)?.insulin;

		expect(insulin?.type).toBe('REFILL');
		expect(insulin?.code).toBe('1106400904401002');
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
		const quantities = result[0].quantity.filter((q) => q.quantity > 0);

		const nphInsulin = quantities.find((q) =>
			q.insulin?.simpleName.includes('INSULINA HUMANA NPH')
		);
		const regularInsulin = quantities.find((q) =>
			q.insulin?.simpleName.includes('INSULINA HUMANA REGULAR')
		);

		expect(nphInsulin?.level).toBe(1); // baixo
		expect(regularInsulin?.level).toBe(2); // médio
	});

	it('should handle empty disponibilidade', () => {
		const emptyResponse = { result: { disponibilidade: [] } };
		const result = fromGetAvailability(emptyResponse);
		expect(result).toEqual([]);
	});
});
