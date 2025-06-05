// @ts-nocheck
import type { PageServerLoad } from './$types';
import { getAvailability } from '@sp-insulina/core/services/e-saude/service';

export const load = async () => {
	return {
		pickups: structuredClone(await getAvailability())
	};
};
;null as any as PageServerLoad;