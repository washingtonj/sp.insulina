<script lang="ts">
	type Props = {
		text: string;
		color?: 'blue' | 'green';
	};

	let { text, color }: Props = $props();
</script>

<div class={['w-fit rounded-lg bg-black px-2 py-1 text-xs text-white']}>
	<p>{text}</p>
</div>
