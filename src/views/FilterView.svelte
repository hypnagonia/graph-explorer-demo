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
  } from "../state/uiState";
  import {
    nodesList,
    isReady,
    nodesScoreDomain,
    nodesAgeDomain,
    nodesDegreeInDomain,
    nodesDegreeOutDomain,
  } from "../data/dataApi.js";

  import { format } from "d3";
  import { orderBy } from "lodash-es";

  // import VirtualList from 'svelte-virtual-list-ce';
  import { Toggle, Search, Dropdown, DropdownItem } from "flowbite-svelte";
  import SliderWithStats from "../lib/ui/SliderWithStats.svelte";

  const scoreFormat = format(".6f");
  const numberFormat = format("d");

  let searchProfileLabel = "";
  let searchActive = false;

  $: filteredItems = orderBy(
    $nodesList.filter(
      (d) =>
        searchProfileLabel.length > 2 &&
        d.label.toLowerCase().includes(searchProfileLabel.toLowerCase()),
    ),
    "label",
    "asc",
  );
</script>

<div class="p-6">
  <div class="space-y-2">
    <Search
      placeholder="Search DID"
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
  <h2 class="text-md font-bold | mb-4">Type</h2>
  <div class="space-y-2">
    <Toggle bind:checked={$showSnapNodes}>Snaps</Toggle>
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

  {#if isReady && false}
    <h2 class="text-md font-bold | my-4">Profiles</h2>
    <div class="space-y-2">
      <Toggle outline bind:checked={$showCuratedNodes}>Curated Profiles</Toggle>
      <Toggle bind:checked={$showInteractionNodes}>Interacting Profiles</Toggle>
    </div>
    {/if}
</div>
{/if}

{#if false}
<div class="p-6">
  
    <h2 class="text-md font-bold | mb-4">Engagements</h2>
    <div class="space-y-2">
      <Toggle bind:checked={$showInteractionEdges}>Incoming</Toggle>
      <Toggle bind:checked={$showInteractionEdgesOutgoing}>Outgoing</Toggle>
    </div>
  
</div>
{/if}
<div class="p-6">
  <h2 class="text-md font-bold | mb-4">Snapshot</h2>
  <div class="flex">
    {#each $snapshotTimestamps as s}
      <div class="inline-block mr-2">
        <div
          class="cursor-pointer inline-block px-2 py-1 rounded-full bg-blue-500 text-white text-sm font-semibold"
          on:click={() => {
            window.location.href = window.location.href.split('?')[0] + '?snapshot=' + s
          }}
        >
          {s}
        </div>
      </div>
    {/each}
  </div>
</div>
