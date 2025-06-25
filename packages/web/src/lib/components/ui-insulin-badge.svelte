<script lang="ts">
  export let name: string;
  export let quantity: number;
  export let low: boolean = false;
</script>

<span class={`rounded px-2 py-0.5 text-xs font-medium ${low ? 'border border-gray-400 text-gray-600 bg-white' : 'bg-black text-white'}`}>
  {name} ({quantity})
</span>
