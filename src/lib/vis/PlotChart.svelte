<script>
  import { getContext } from 'svelte';
  import * as Plot from '@observablehq/plot';
  import { merge } from 'lodash-es';
  import { select } from 'd3';

  export let options = {};
  export let chart = undefined;

  let theme = getContext('theme');
  let container;

  $: defaultOptions = {
    style: {
      backgroundColor: 'transparent',
      color: theme.colors.gray['500'],
      fontFamily: theme.fontFamily.sans,
      fontSize: '14px',
      overflow: 'visible',
    },
  };

  $: fullOptions = merge(defaultOptions, options);

  $: myplot = (node) => {
    node.appendChild(Plot.plot(fullOptions));
  };

  $: {
    if (container) {
      chart = select(container).select('svg');
    }
  }

  // let clientWidth;
</script>

{#key options}
  <!-- <div style:width="100%" bind:clientWidth> -->
  <div use:myplot bind:this="{container}" {...$$restProps}></div>
  <!-- </div> -->
{/key}
