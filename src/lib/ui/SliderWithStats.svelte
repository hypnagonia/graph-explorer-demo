<script>
  import Debouncer from 'svelte-debouncer';
  import { Button } from 'flowbite-svelte';
  import Slider from '@bulatdashiev/svelte-slider';

  export let start;
  export let end;
  export let label;
  export let domain;
  export let format;
  export let step = undefined;

  $: values = [start, end];
  $: canReset = domain[0] !== values[0] || domain[1] !== values[1];
  $: stepNum = step ? step : Math.abs(domain[1] - domain[0]) / 1000;

  const valueDebouncer = new Debouncer((v) => {
    start = v[0];
    end = v[1];
  }, 150);

  $: valueDebouncer.debounce(values);
</script>

<div>
  {#if label}
    <div class="mt-6 mb-1 | flex flex-row items-center space-x-3">
      <span class="text-sm font-medium">{label}</span>
      {#if canReset}
        <Button
          class="h-2 px-4 "
          size="xs"
          color="alternative"
          on:click="{() => {
            start = domain[0];
            end = domain[1];
          }}">Reset</Button
        >
      {/if}
    </div>
  {/if}
  <div class="flex flex-row justify-between">
    <span class="text-xs text-gray-500">{format(start)}</span>
    <span class="text-xs text-gray-500">{format(end)}</span>
  </div>
  <Slider
    min="{domain[0]}"
    max="{domain[1]}"
    step="{stepNum}"
    bind:value="{values}"
    range
  />
</div>

<style lang="css">
  :root {
    --track-bg: #e5e7eb;
    --progress-bg: #9ca3af;
    --thumb-bg: #000000;
  }
</style>
