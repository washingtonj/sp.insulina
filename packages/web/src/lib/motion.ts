const REDUCED =
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Duração de animação respeitando "reduzir movimento". */
export function motion(ms: number): number {
	return REDUCED ? 0 : ms;
}

/** Atraso em cascata, limitado para não virar espera. */
export function stagger(index: number, step = 24, cap = 160): number {
	return REDUCED ? 0 : Math.min(index * step, cap);
}
