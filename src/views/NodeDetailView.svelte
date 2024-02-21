<script>
  import { getContext } from "svelte";
  import { format } from "d3";
  import { slice, map } from "lodash-es";
  import { selectedNodeDetails, nodesByLabel } from "../data/dataApi";
  import { selectedNodeId } from "../state/uiState";
  import { Toggle } from "flowbite-svelte";

  import * as Plot from "@observablehq/plot";
  import { select, selectAll } from "d3";

  import { Button } from "flowbite-svelte";
  import PlotChart from "../lib/vis/PlotChart.svelte";
  import {
    showInteractionEdges,
    showInteractionEdgesOutgoing,
  } from "../state/uiState";

  let theme = getContext("theme");

  $: topEdges =
    $selectedNodeDetails && $selectedNodeDetails.edges.length > 0
      ? map(slice($selectedNodeDetails.edges, 0, 10), (d) => {
          return {
            id: d.source.id,
            label: d.source.label,
            color: theme.colors.scale.nodes[d.source.curated],
            value: d.weight,
          };
        })
      : [];

  $: edges = map($selectedNodeDetails.edges, (d) => {
    return {
      id: d.source.id,
      color: theme.colors.scale.nodes[d.source.curated],
      value: d.weight,
    };
  });

  $: hasEdges = edges.length > 0;
  $: hasTopEdges = topEdges.length > 0;

  let topChart;

  $: {
    if (topChart) {
      topChart
        .selectAll('g[aria-label="y-axis tick label"]')
        .style("cursor", "pointer")
        .on("click", (event) => {
          const label = event.target.innerHTML;
          if ($nodesByLabel[label]) {
            $selectedNodeId = $nodesByLabel[label].id;
          }
        });
    }
  }
  const scoreFormat = format(".8f");
</script>

<div class="tooltip-view">
  {#if $selectedNodeDetails}
    <div>
      <div class="px-6 py-4 flex flex-row items-center justify-between">
        <div
          class="font-bold text-sm"
          style="word-break:break-all;max-width:300px;font-size:20px;"
        >
          {$selectedNodeDetails.isSnap ? $selectedNodeDetails.label : "Peer"}
        </div>
        <Button
          pill
          outline
          size="xs"
          on:click={() => {
            $selectedNodeId = "";
          }}>Close</Button
        >
      </div>

      <hr />
      <div class="px-6 py-4">
        <div style="font-weight:bold;font-size:12px;word-break:break-all;">
          {$selectedNodeDetails.isSnap
            ? $selectedNodeDetails.id.split("/").slice(-1)[0]
            : $selectedNodeDetails.id.split(":").slice(-1)[0]}
        </div>
      </div>
      <hr />
      <div class="px-6 py-4">
        <table class="text-sm text-gray-500 w-full">
          <tr>
            <td class="pr-4" colspan="2"> </td>
          </tr>
          {#if $selectedNodeDetails.isSnap === true}
            <tr>
              <td class="pr-4">Confidence</td>
              <td>{$selectedNodeDetails.rank}</td>
            </tr>
            <tr>
              <td class="pr-4">Score</td>
              <td>{scoreFormat($selectedNodeDetails.score)}</td>
            </tr>
            <tr>
              <td class="pr-4">Assertions Received</td>
              <td>{$selectedNodeDetails.attestationReceivedCount}</td>
            </tr>
          {/if}
          {#if $selectedNodeDetails.isSnap === false}
            <tr>
              <td class="pr-4">Rank</td>
              <td>#1</td>
            </tr>
            <tr>
              <td class="pr-4">Score</td>
              <td>{scoreFormat($selectedNodeDetails.score)}</td>
            </tr>
            <tr>
              <td class="pr-4">Accuracy</td>
              <td>1</td>
            </tr>

            <tr>
              <td class="pr-4">Assertions Sent</td>
              <td>{$selectedNodeDetails.attestationIssuedCount}</td>
            </tr>
            <tr>
              <td class="pr-4">Assertions Received</td>
              <td>{$selectedNodeDetails.attestationReceivedCount}</td>
            </tr>
          {/if}
        </table>
      </div>
      <hr />
      <div class="px-6 py-4">
        <table class="text-sm text-gray-500 w-full">
          {#if !$selectedNodeDetails.isSnap}
            <tr>
              <td class="pr-4">
                <br />
                <Toggle bind:checked={$showInteractionEdges}>Incoming</Toggle>
                <br />
                <Toggle bind:checked={$showInteractionEdgesOutgoing}
                  >Outgoing</Toggle
                >
              </td>
            </tr>
          {/if}
        </table>
      </div>

      {#if hasTopEdges && false}
        <div class="px-6 py-4 {hasEdges && hasTopEdges ? 'border-b' : ''}">
          <h3 class="text-sm">Top Incoming Engagements</h3>
          <PlotChart
            options={{
              marginLeft: 175,
              marginRight: 100,
              x: { axis: null },
              y: { label: null },
              marks: [
                Plot.barX(topEdges, {
                  x: "value",
                  y: "label",
                  fill: (d) => d.color,
                  sort: { y: "x", reverse: true, limit: 10 },
                }),
                Plot.text(topEdges, {
                  text: (d) => d.value,
                  y: "label",
                  x: "value",
                  textAnchor: "start",
                  dx: 10,
                }),
              ],
            }}
            bind:chart={topChart}
          />
        </div>
      {/if}

      {#if hasEdges && false}
        <div class="px-6 py-4">
          <h3 class="text-sm mb-3">Incoming Engagement Distribution</h3>
          <PlotChart
            options={{
              marginTop: 30,
              marginBottom: 50,
              height: 300,
              x: {
                grid: false,
                label: "Score",
                percent: true,
              },
              y: { grid: true },
              marks: [
                Plot.rectY(
                  edges,
                  Plot.binX(
                    { y: "count" },
                    { x: "value", fill: (d) => d.color },
                  ),
                ),
                Plot.ruleY([0]),
              ],
            }}
          />
        </div>
      {/if}
    </div>
  {/if}
</div>
