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
  import { isMobile } from "../../data/dataStore";

  export let nodes = [];
  export let edges = [];
  export let width = 1200;
  export let height = 800;
  export let hoveredNode = "";
  export let selectedNode = "";

  let pointsWithHighlights = [];
  let theme = getContext("theme");

  const margin = isMobile
    ? { top: 5, right: 5, bottom: 50, left: 5 }
    : { top: 30, right: 100, bottom: 50, left: 100 };

  const maxNodeSize = 20;
  const scaleLinkSize = scaleSqrt();
  const scaleLinkOpacity = scaleLinear();
  const scaleNodeSize = scaleSqrt();

  const colorItems = map(theme.colors.scale.nodes, (d, k) => {
    return {
      label: k == "true" ? "Peers" : "Snaps",
      color: k == "true" ? "yellow" : "lightblue",
      class: k == "true" ? "rounded-md" : "md",
    };
  });

  $: nodeExtent = extent(nodes, (d) => d.score);
  $: linkExtent = extent(edges, (d) => d.weight);

  $: stageWidth = width / 2; //- margin.left - margin.right;
  $: stageHeight = height / 2; //- margin.top - margin.bottom;

  $: {
    if (nodes.length !== 0 && edges.length !== 0) {
      scaleLinkSize.range([0.5, maxNodeSize]).domain(linkExtent);
      scaleLinkOpacity.range([0.2, 0.9]).domain(linkExtent);
      scaleNodeSize.range([1, maxNodeSize]).domain(nodeExtent);
    }
  }

  $: points = orderBy(
    map(nodes, (d, i) => {
      let size;

      if (d.isSnap) {
        size = 10;
      } else if (d.label.indexOf("did") !== 0) {
        size = 5;
      } else {
        size = Math.min(
          d.score > 0
            ? scaleNodeSize(d.score)
            : d.score < 0
              ? scaleNodeSize(-d.score)
              : scaleNodeSize(0.5),
          5,
        );
      }

      // isIncludedInScores

      let color;

      if (!d.isIncludedInScores && false) {
        color = "white";
      } else if (d.score === '-') {
        color = "grey";
      } else if (d.isSnap) {
        color = d.score > 0 ? "#55FFFF" : "#00AAAA";
      } else {
        color = d.score > 0 ? "#FFFF55" : "#8B8000" 
      }

      return {
        ...d,
        x: d.x * (stageWidth - margin.left - margin.right) + margin.left, //+ margin.left,
        y: d.y * (stageHeight - margin.top - margin.bottom) + margin.top,
        size,
        // color: theme.colors.scale.nodes[d.curated],
        color,
        borderColor: d.seed ? "#F3FF7A" : "#000",
        seed: d.seed,
      };
    }),
    ["selected", "size"],
  );

  // ega pallete https://moddingwiki.shikadi.net/wiki/EGA_Palette
  $: pointsById = keyBy(points, "id");
  $: connections = isEmpty(pointsById)
    ? []
    : map(edges, (d, i) => {
        return {
          ...d,
          source: pointsById[d.source],
          target: pointsById[d.target],
          size: Math.max(
            d.size ||
              (d.weight > 0
                ? scaleLinkSize(d.weight) / 24
                : scaleLinkSize(-d.weight) / 24),
            0.5,
          ),
          color:
            d.color ||
            (d.weight > 0 ? "#30ee60" : d.weight < 0 ? "#ee3060" : "grey"), // theme.colors.scale.edge,
          opacity: 1, // scaleLinkOpacity(d.weight),
        };
      });

  $: c = connections;
</script>

<div class="network h-full w-full absolute bg-black">
  <PixiApp>
    <PixiNetwork
      nodes={points}
      edges={c}
      width={stageWidth}
      height={stageHeight}
      on:node-mouseover
      on:node-mouseout
      on:node-click
    />
  </PixiApp>
  {#if false}
    <div
      class="bg-black text-white border border-gray-800 px-4 py-2 rounded-md shadow-md | absolute bottom-4 left-4 | text-sm"
    >
      <div>
        <ul class="space-y-2">
          <li><strong>Size</strong><br /> Score</li>

          <li>
            {#if false}
              <strong>Color</strong><br />
            {/if}
            {#each colorItems as d}
              <div class="space-x-3">
                <span
                  ><span
                    class="w-2 h-2 inline-block {d.class}"
                    style="background-color: {d.color}"
                  ></span>
                  {d.label}</span
                >
              </div>
            {/each}
          </li>
          {#if false}
            <li><strong>Line Color</strong><br /> Target node type</li>
          {/if}
        </ul>
      </div>
    </div>
  {/if}
</div>
