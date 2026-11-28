import { VISIBLE_FORMATS, type InsulinType, type InsulinVariant, type Place } from './places';

export type StockLevel = 0 | 1 | 2 | 3;

export type StockSelection = {
	variants?: InsulinVariant[];
	types?: InsulinType[];
};

const ALL_VARIANTS: InsulinVariant[] = ['NPH', 'REGULAR'];

/**
 * Cobertura dos itens pedidos: alta só quando **todos** têm estoque.
 * Um item faltando rebaixa a unidade — nada de verde com furo.
 */
export function stockLevel(place: Place, selection: StockSelection = {}): StockLevel {
	const variants = selection.variants?.length ? selection.variants : ALL_VARIANTS;
	const types = selection.types?.length ? selection.types : VISIBLE_FORMATS;

	const required = types.length * variants.length;
	let missing = 0;

	for (const type of types) {
		for (const variant of variants) {
			const item = place.availability.find(
				(candidate) => candidate.insulin.type === type && candidate.insulin.variant === variant
			);

			if (!item || item.quantity <= 0) missing += 1;
		}
	}

	if (missing === 0) return 3;
	if (missing === 1) return 2;
	if (missing < required) return 1;

	return 0;
}

export const STOCK_LEVEL_COLOR: Record<StockLevel, string> = {
	3: '#34d399',
	2: '#fbbf24',
	1: '#f87171',
	0: '#9ca3af'
};

export const STOCK_LEVEL_LABEL: Record<StockLevel, string> = {
	3: 'Completo',
	2: 'Falta 1',
	1: 'Parcial',
	0: 'Sem estoque'
};

export const STOCK_LEVELS: StockLevel[] = [3, 2, 1, 0];
