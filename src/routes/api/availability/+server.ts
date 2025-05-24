import type { RequestHandler } from './$types';
import { GetInsulinAvailability } from '../../../core/usecases/get-insulin-availability';

export const GET: RequestHandler = async () => {
	const usecase = new GetInsulinAvailability();
	const result = await usecase.execute();

	return new Response(JSON.stringify(result), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	});
};
