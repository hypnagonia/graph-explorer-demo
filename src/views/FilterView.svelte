<script>
  import {
    selectedNodeId,
    showCuratedNodes,
    showInteractionNodes,
    showInteractionEdges,
    nodesFilterMode,
    minNodeScore,
    maxNodeScore,
    minNodeAge,
    maxNodeAge,
    minNodeDegreeIn,
    maxNodeDegreeIn,
    minNodeDegreeOut,
    maxNodeDegreeOut,
    showSnapNodes,
    showUserNodes,
    showInteractionEdgesOutgoing,
    showDeveloperNodes,
    showAuditorNodes,
    snapshotTimestamps,
    snapLabelFilters,
  } from "../state/uiState";
  import {
    nodesList,
    isReady,
    nodesScoreDomain,
    nodesAgeDomain,
    nodesDegreeInDomain,
    nodesDegreeOutDomain,
    snapshots,
  } from "../data/dataApi.js";
  import { snapshotId } from "../data/dataStore";

  import { format } from "d3";
  import { orderBy } from "lodash-es";

  // import VirtualList from 'svelte-virtual-list-ce';
  import {
    Toggle,
    Search,
    Dropdown,
    DropdownItem,
    Button,
  } from "flowbite-svelte";
  import SliderWithStats from "../lib/ui/SliderWithStats.svelte";

  const scoreFormat = format(".6f");
  const numberFormat = format("d");

  let searchProfileLabel = "";
  let searchActive = false;

  $: filteredItems = orderBy(
    $nodesList.filter(
      (d) =>
        (searchProfileLabel.length > 2 &&
          d.id.toLowerCase().includes(searchProfileLabel.toLowerCase())) ||
        d.label.toLowerCase().includes(searchProfileLabel.toLowerCase()),
    ),
    "label",
    "asc",
  );

  function toLocaleString(snapshot) {
    const date = new Date(+snapshot);
    const localString = date.toLocaleString();
    return localString;
  }
</script>

<div class="p-6">
  <div class="space-y-2">
    <Search
      placeholder="Search a Snap or User"
      bind:value={searchProfileLabel}
      on:input={() => {
        searchActive = true;
      }}
    />
    {#if filteredItems.length > 0}
      <Dropdown
        open={searchActive}
        class="max-h-[50vh] space-y-1 overflow-y-auto p-3"
      >
        {#each filteredItems as item}
          <DropdownItem
            on:click={() => {
              $selectedNodeId = item.id;
              searchProfileLabel = "";
            }}>{item.label}</DropdownItem
          >
        {/each}
      </Dropdown>
    {/if}
  </div>
</div>

<div class="p-6">
  <h2 class="text-md font-bold | mb-4">Snaps</h2>
  <div class="space-y-2">
    <Toggle bind:checked={$showSnapNodes}>All</Toggle>
    {#each $snapLabelFilters as s}
      <Toggle bind:checked={s.value}>{s.label}</Toggle>
    {/each}
  </div>
</div>

<div class="p-6">
  <h2 class="text-md font-bold | mb-4">Peers</h2>
  <div class="space-y-2">
    <Toggle bind:checked={$showAuditorNodes}>Auditors</Toggle>
    <Toggle bind:checked={$showDeveloperNodes}>Developers</Toggle>
  </div>
</div>

{#if isReady && false}
  <div class="p-6-a">
    <div>
      <h2 class="text-md font-bold | mb-2">Filters</h2>

      <SliderWithStats
        label="Score"
        bind:start={$minNodeScore}
        bind:end={$maxNodeScore}
        domain={$nodesScoreDomain}
        format={scoreFormat}
      />
      <SliderWithStats
        label="Interacted Days"
        bind:start={$minNodeAge}
        bind:end={$maxNodeAge}
        domain={$nodesAgeDomain}
        format={numberFormat}
        step={1}
      />
      <SliderWithStats
        label="Incoming Engagements"
        bind:start={$minNodeDegreeIn}
        bind:end={$maxNodeDegreeIn}
        domain={$nodesDegreeInDomain}
        format={numberFormat}
        step={1}
      />
      <SliderWithStats
        label="Outgoing Engagements"
        bind:start={$minNodeDegreeOut}
        bind:end={$maxNodeDegreeOut}
        domain={$nodesDegreeOutDomain}
        format={numberFormat}
        step={1}
      />

      {#if isReady && false}
        <div class="flex flex-row my-4 justify-center items-center">
          <span class="text-sm pr-3">Mark</span>
          <Toggle bind:checked={$nodesFilterMode} /><span class="text-sm"
            >Filter</span
          >
        </div>
      {/if}
    </div>
  </div>
{/if}

<div class="p-6">
  <div>
    <div class="cursor-pointer font-bold">
      Snapshots ({$snapshots.length})
    </div>
    <Dropdown class="w-64 overflow-y-auto py-4 h-48">
      {#each $snapshots as s}
        <DropdownItem
          class={s === snapshotId ? "bg-blue-500" : ""}
          on:click={() => {
            window.location.href =
              window.location.href.split("?")[0] + "?snapshot=" + s;
          }}>{toLocaleString(s)}</DropdownItem
        >
      {/each}
    </Dropdown>
  </div>

  <div class="fixed bottom-0 right-0 m-4">
    <!-- Your content here -->
    <p class="bg-white p-4 rounded-lg">
      Snapshot {toLocaleString(snapshotId)}
    </p>
  </div>
</div>
