<script>
  import Tooltip from "../lib/mouse/Tooltip.svelte";
  import { format } from "d3";

  import { hoveredNodeId, isMenuVisible } from "../state/uiState";
  import { hoveredNodeDetails } from "../data/dataApi";
  import { isMobile, snapshotId, mode } from "../data/dataStore";
  const scoreFormat = format(".8f");
</script>

<div class="tooltip-view" style={`opacity:${isMobile ? '0.7' : '1'};`}>
  {#if $hoveredNodeId !== "" && $hoveredNodeDetails && !$isMenuVisible}
    <Tooltip>
      <div class="text-sm">
        <div class="py-2 px-4 whitespace-nowrap">
          <strong>{$hoveredNodeDetails.label}</strong>
        </div>
        <hr />
        <div class="py-2 px-4 text-gray-500 text-sm">
          <table>
            <tr>
              <td class="pr-4"><strong>Status</strong></td>
              <td>{$hoveredNodeDetails.label_badge}</td>
            </tr>
            {#if $hoveredNodeDetails.isSnap === true}
              <tr>
                <td class="pr-4"><strong>Confidence</strong></td>
                <td>{$hoveredNodeDetails.confidence}</td>
              </tr>
            {/if}
            {#if $hoveredNodeDetails.isSnap === false && mode.id !== 'SoftwareDevelopment'}
              <tr>
                <td class="pr-4"><strong>Accuracy</strong></td>
                <td>{($hoveredNodeDetails.accuracy * 100).toFixed(0)}%</td>
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
