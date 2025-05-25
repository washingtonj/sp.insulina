import type { PageServerLoad } from './$types';
import { GetInsulinAvailability } from '../core/usecases/get-insulin-availability';

export const load: PageServerLoad = async () => {
	const usecase = new GetInsulinAvailability();
	const result = await usecase.execute();

	return {
		availability: structuredClone(result)
	};
};
