<script>
  import Tooltip from "../lib/mouse/Tooltip.svelte";
  import { format } from "d3";

  import { hoveredNodeId } from "../state/uiState";
  import { hoveredNodeDetails } from "../data/dataApi";

  const scoreFormat = format(".8f");
</script>

<div class="tooltip-view">
  {#if $hoveredNodeId !== "" && $hoveredNodeDetails}
    <Tooltip>
      <div class="text-sm">
        <div class="py-2 px-4 whitespace-nowrap">
          <strong>{$hoveredNodeDetails.label}</strong>
        </div>
        <hr />
        <div class="py-2 px-4 text-gray-500 text-sm">
          <table>
            <tr>
              <td class="pr-4"><strong>Label</strong></td>
              <td>{$hoveredNodeDetails.label_badge}</td>
            </tr>
            {#if $hoveredNodeDetails.isSnap === true}
              <tr>
                <td class="pr-4"><strong>Confidence</strong></td>
                <td>{$hoveredNodeDetails.rank}</td>
              </tr>
            {/if}
            {#if $hoveredNodeDetails.isSnap === false}
              <tr>
                <td class="pr-4"><strong>Rank</strong></td>
                <td>#1</td>
              </tr>
              <tr>
                <td class="pr-4"><strong>Accuracy</strong></td>
                <td>1</td>
              </tr>
            {/if}
            <tr>
              <td><strong>Score</strong></td>
              <td>{scoreFormat($hoveredNodeDetails.score)}</td>
            </tr>
          </table>
        </div>
      </div></Tooltip
    >
  {/if}
</div>
