import {
	NO_FILTERS,
	selectPlaces,
	withDistance,
	type Coordinates,
	type Filters,
	type Place
} from './places';
import { API_URL } from './api';
import { fetchBestDayProfile, type BestDayProfile } from './best-day';

function parsePlaces(payload: unknown): Place[] {
	if (!Array.isArray(payload)) {
		throw new Error('Resposta inesperada da API: esperava uma lista de locais');
	}

	return payload;
}

export class PlacesState {
	places = $state<Place[]>([]);
	isLoading = $state(true);
	loadError = $state<string | null>(null);
	locationError = $state<string | null>(null);
	isLocating = $state(false);
	filters = $state<Filters>({ ...NO_FILTERS });
	search = $state('');
	origin = $state<Coordinates | null>(null);
	selectedId = $state<string | null>(null);
	bestDays = $state<BestDayProfile>({});

	located = $derived(
		this.places.map((place) => (this.origin ? withDistance(place, this.origin) : place))
	);

	matching = $derived(selectPlaces(this.located, { filters: this.filters, search: this.search }));

	results = $derived(this.matching);

	selected = $derived(this.matching.find((place) => place.id === this.selectedId) ?? null);

	async load() {
		try {
			this.isLoading = true;
			this.loadError = null;
			const [response, bestDays] = await Promise.all([
				fetch(`${API_URL}/`),
				fetchBestDayProfile().catch(() => ({}))
			]);
			if (!response.ok) throw new Error(`GET ${API_URL}/ respondeu ${response.status}`);

			this.places = parsePlaces(await response.json());
			this.bestDays = bestDays;
		} catch (cause) {
			console.error(cause);
			this.loadError =
				'Não foi possível carregar os locais. Verifique sua conexão e tente novamente.';
		} finally {
			this.isLoading = false;
		}
	}

	locate() {
		if (!navigator.geolocation) {
			this.locationError = 'Geolocalização não é suportada neste navegador';
			return;
		}

		this.isLocating = true;
		navigator.geolocation.getCurrentPosition(
			(position) => {
				this.origin = {
					latitude: position.coords.latitude,
					longitude: position.coords.longitude
				};
				this.locationError = null;
				this.isLocating = false;
			},
			() => {
				this.locationError =
					'Não foi possível obter sua localização. Verifique as permissões do navegador';
				this.isLocating = false;
			}
		);
	}

	applyFilters(filters: Filters) {
		this.filters = filters;
	}

	clearFilters() {
		this.filters = { ...NO_FILTERS };
	}
}
