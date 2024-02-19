<script>
  import mouse from '../../state/mouseState';

  export let width = 300;
  let windowWidth = 0;

  $: halfWidth = (width + 20) / 2;
  $: y = $mouse.y;
  $: x =
    $mouse.x - halfWidth < 0
      ? halfWidth
      : $mouse.x + halfWidth > windowWidth
      ? windowWidth - halfWidth
      : $mouse.x;
</script>

<svelte:window bind:innerWidth="{windowWidth}" />
<div class="tooltip__wrapper" style="{`top: ${y}px; left: ${x}px;`}">
  <div class="tooltip absolute bg-white shadow-md rounded-md">
    <slot />
  </div>
</div>

<style>
  .tooltip__wrapper {
    pointer-events: none;
    position: absolute;
    z-index: 9999;
  }
  .tooltip {
    pointer-events: none;
    transform: translate(-50%, 20px);
  }
</style>
