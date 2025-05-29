import type { PageServerLoad } from './$types';
import { getAvailability } from '$core/services/e-saude/service';

export const load: PageServerLoad = async () => {
	return {
		pickups: structuredClone(await getAvailability())
	};
};
