type UserState = {
	location: {
		data?: {
			latitude: number;
			longitude: number;
		};
		error?: string;
		isLoading: boolean;
	};
};

export const userState = $state<UserState>({
	location: {
		isLoading: false
	}
});

export function setLocation() {
	if (!navigator.geolocation) {
		userState.location.error = 'Geolocalização não suportada neste navegador.';
		return;
	}

	userState.location.error = '';
	userState.location.isLoading = true;

	navigator.geolocation.getCurrentPosition(
		(pos) => {
			userState.location.data = {
				latitude: pos.coords.latitude,
				longitude: pos.coords.longitude
			};

			userState.location.isLoading = false;
		},
		() => {
			userState.location.error = 'Não foi possível obter sua localização.';
			userState.location.isLoading = false;
		}
	);
}
