import { writable } from 'svelte/store';

export default (function () {
  const { subscribe, set } = writable({
    x: 0,
    y: 0,
  });
  document.onmousemove = (e) => {
    set({
      x: e.pageX,
      y: e.pageY,
    });
  };
  return {
    subscribe,
  };
})();
