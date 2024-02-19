<script>
  //https://observablehq.com/@kikinna/uaah-force-directed-layout-in-a-grid
  //observablehq.com/d/12eb7427340b26d8
  import { getContext } from "svelte";
  import { extent } from "d3-array";
  import { scaleSqrt, scaleLinear } from "d3-scale";
  import {
    map,
    orderBy,
    forEach,
    filter,
    isEmpty,
    keyBy,
    groupBy,
  } from "lodash-es";

  import PixiApp from "./PixiApp.svelte";
  import PixiNetwork from "./PixiNetwork.svelte";

  export let nodes = [];
  export let edges = [];
  export let width = 1200;
  export let height = 800;
  export let hoveredNode = "";
  export let selectedNode = "";

  let pointsWithHighlights = [];
  let theme = getContext("theme");

  const margin = { top: 30, right: 30, bottom: 30, left: 30 };

  const maxNodeSize = 20;
  const scaleLinkSize = scaleSqrt();
  const scaleLinkOpacity = scaleLinear();
  const scaleNodeSize = scaleSqrt();

  const colorItems = map(theme.colors.scale.nodes, (d, k) => {
    return {
      label: k == "true" ? "Peers" : "Snaps",
      color: k == "true" ? "yellow" : "lightblue",
    };
  });

  $: nodeExtent = extent(nodes, (d) => d.score);
  $: linkExtent = extent(edges, (d) => d.weight);

  $: stageWidth = width - margin.left // - margin.right;
  $: stageHeight = height - margin.top // - margin.bottom;

  $: {
    if (nodes.length !== 0 && edges.length !== 0) {
      scaleLinkSize.range([0.5, maxNodeSize]).domain(linkExtent);
      scaleLinkOpacity.range([0.2, 0.9]).domain(linkExtent);
      scaleNodeSize.range([1, maxNodeSize]).domain(nodeExtent);
    }
  }

  $: points = orderBy(
    map(nodes, (d, i) => ({
      ...d,
      x: d.x * (stageWidth + 2000)+ margin.left ,
      y: d.y * (stageHeight + 2000) + margin.top,
      size: d.score > 0 ? scaleNodeSize(d.score) + 20 : (d.score < 0 ? scaleNodeSize(-d.score) + 20 : scaleNodeSize(0.5) ),
      // color: theme.colors.scale.nodes[d.curated],
      color: d.isSnap ? (d.score > 0 ? "cyan" : "grey") : (d.score > 0 ? "yellow" : (d.score < 0 ? "purple" : "grey")), 
      borderColor: d.seed ? "#F3FF7A" : "#000",
      seed: d.seed,
    })),
    ["selected", "size"],
  );

  $: p2 =
    points &&
    points

  $: pointsById = keyBy(points, "id");
  $: connections = isEmpty(pointsById)
    ? []
    : map(edges, (d, i) => {
        return {
          ...d,
          source: pointsById[d.source],
          target: pointsById[d.target],
          size: d.size || (d.weight > 0 ? scaleLinkSize(d.weight) / 16 : scaleLinkSize(-d.weight) / 16),
          color: d.color || (d.weight > 0 ? "#00e040" : "#e00040"), // theme.colors.scale.edge,
          opacity: 1, // scaleLinkOpacity(d.weight),
        };
      });

  $: c = connections;
</script>

<div class="network h-full w-full absolute bg-black">
  <PixiApp>
    <PixiNetwork
      nodes={p2}
      edges={c}
      width={stageWidth}
      height={stageHeight}
      on:node-mouseover
      on:node-mouseout
      on:node-click
    />
  </PixiApp>
  <div
    class="bg-black text-white border border-gray-800 px-4 py-2 rounded-md shadow-md | absolute bottom-4 left-4 | text-sm"
  >
    <div>
      <ul class="space-y-2">
        <li><strong>Circle Size</strong><br /> Score</li>
        <li>
          <strong>Circle Color</strong><br />{#each colorItems as d}
            <div class="space-x-3">
              <span
                ><span
                  class="w-2 h-2 inline-block rounded-md"
                  style="background-color: {d.color}"
                ></span>
                {d.label}</span
              >
            </div>
          {/each}
        </li>
        <li><strong>Line Color</strong><br /> Target node type</li>
      </ul>
    </div>
  </div>
</div>
