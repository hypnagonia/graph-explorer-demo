<script>
  import { onMount, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import * as PIXI from 'pixi.js';

  let container;
  let parent;

  const app = writable();
  setContext('pixiApp', app);

  onMount(() => {
    $app = new PIXI.Application({
      background: '#000',
      backgroundAlpha: 1,
      // resizeTo: parent,
      autoDensity: false,
      antialias: false,
      resolution: 1,
      view: container,
      autoStart: false,
    });
  });
</script>
<div class="w-full h-full" bind:this={parent}>
  <canvas bind:this="{container}"></canvas>
  <slot />
</div>
