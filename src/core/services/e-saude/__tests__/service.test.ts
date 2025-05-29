import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ESaudeService } from '../service';
import { STATIC_INSULINS } from '../consts';

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

	it('should make POST request with correct data', async () => {
		const mockResponse = {
			result: {
				disponibilidade: []
			}
		};

		fetchSpy.mockResolvedValueOnce({
			json: async () => mockResponse
		} as unknown as Response);

		await service.getAvailability();

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [url, options] = fetchSpy.mock.calls[0];

		expect(url).toContain('/disponilidadesParaMedicamentos');
		expect(options!.method).toBe('POST');
		// @ts-expect-error - options is not defined in the type
		expect(options!.headers?.['Content-Type']).toBe('application/json');

		// @ts-expect-error - options is not defined in the type
		const body = JSON.parse(options!.body);
		expect(body.data.medicamentos).toEqual(
			STATIC_INSULINS.map((insulin) => ({
				id: insulin.code,
				name: insulin.fullName
			}))
		);
	});
});
