<script lang="ts">
	import { page } from '$app/state';
	import AvailabilityCharts from '$lib/components/availability-charts.svelte';

	const pickupId = $derived(page.url.searchParams.get('place') ?? undefined);
</script>

<svelte:head>
	<title>Histórico de disponibilidade — sp.insulina</title>
</svelte:head>

<div
	class="mx-auto flex min-h-screen max-w-4xl flex-col gap-5 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-8 md:py-8"
>
	<header class="flex flex-col gap-3">
		<a href="/" class="text-muted hover:text-ink text-footnote flex min-h-11 w-fit items-center"
			>← Voltar ao mapa</a
		>
		<div>
			<h1 class="text-title-1 font-extrabold">
				{pickupId ? 'Histórico da unidade' : 'Disponibilidade da rede'}
			</h1>
			<p class="text-muted text-footnote mt-1">
				Cada ponto é a última leitura do dia de cada unidade, no horário de São Paulo.
			</p>
		</div>
	</header>

	<AvailabilityCharts {pickupId} />
</div>
