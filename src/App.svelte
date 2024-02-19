<script>
  import { setContext } from 'svelte';
  import {
    isReady,
    nodesDetails,
    edgesDetails,
    nodesScoreDomain,
    nodesAgeDomain,
    nodesDegreeInDomain,
    nodesDegreeOutDomain,
  } from './data/dataApi.js';
  import {
    hoveredNodeId,
    selectedNodeId,
    minNodeScore,
    maxNodeScore,
    minNodeAge,
    maxNodeAge,
    minNodeDegreeIn,
    maxNodeDegreeIn,
    minNodeDegreeOut,
    maxNodeDegreeOut,
  } from './state/uiState.js';
  import theme from './config/theme';

  import Network from './lib/vis/Network.svelte';
  import Loader from './lib/ui/Loader.svelte';
  import Logo from './lib/ui/Logo.svelte';
  import FilterView from './views/FilterView.svelte';
  import TooltipView from './views/TooltipView.svelte';
  import NodeDetailView from './views/NodeDetailView.svelte';

  let width, height;

  setContext('theme', theme);

  $: {
    if ($isReady) {
      // node score
      if ($minNodeScore === undefined) {
        $minNodeScore = $nodesScoreDomain[0];
      }
      if ($maxNodeScore === undefined) {
        $maxNodeScore = $nodesScoreDomain[1];
      }
      // node age
      if ($minNodeAge === undefined) {
        $minNodeAge = $nodesAgeDomain[0];
      }
      if ($maxNodeAge === undefined) {
        $maxNodeAge = $nodesAgeDomain[1];
      }

      // degree in
      if ($minNodeDegreeIn === undefined) {
        $minNodeDegreeIn = $nodesDegreeInDomain[0];
      }
      if ($maxNodeDegreeIn === undefined) {
        $maxNodeDegreeIn = $nodesDegreeInDomain[1];
      }
      // degree out
      if ($minNodeDegreeOut === undefined) {
        $minNodeDegreeOut = $nodesDegreeOutDomain[0];
      }
      if ($maxNodeDegreeOut === undefined) {
        $maxNodeDegreeOut = $nodesDegreeOutDomain[1];
      }
    }
  }
</script>

{#if $isReady}
  <main class="min-h-screen flex flex-col h-screen">
    <div class="header | p-4 bg-gray-800">
      <h1 class=" text-white font-serif flex flex-row">
        <Logo /> <span class="text-gray-500 pl-2 tracking-wider">EXPLORER</span>
      </h1>
    </div>
    <div class="flex flex-row flex-1 overflow-auto">
      <div class="basis-9/12 h-full">
        <div
          class="stage"
          bind:clientWidth="{width}"
          bind:clientHeight="{height}"
        >
          <div class="stage__wrapper">
            <Network
              width="{width}"
              height="{height}"
              nodes="{$nodesDetails}"
              edges="{$edgesDetails}"
              on:node-mouseover="{(d) => {
                $hoveredNodeId = d.detail;
              }}"
              on:node-mouseout="{(d) => {
                $hoveredNodeId = '';
              }}"
              on:node-click="{(d) => {
                if ($selectedNodeId !== '') {
                  if ($selectedNodeId === d.detail) {
                    $selectedNodeId = '';
                  } else {
                    $selectedNodeId = d.detail;
                  }
                } else {
                  $selectedNodeId = d.detail;
                }
              }}"
            />
          </div>
        </div>
      </div>
      <div
        class="flex flex-col flex-1 overflow-auto | basis-3/12 h-full | border-l border-l-gray-800"
      >
        {#if $selectedNodeId == ''}
          <FilterView />
        {:else}<NodeDetailView />{/if}
      </div>
    </div>
  </main>
  <TooltipView />
{:else}
  <Loader />
{/if}

<style>
  .stage {
    width: 100%;
    height: 100%;
  }
  .stage__wrapper {
    position: absolute;
    width: 100%;
    height: 100%;
  }
</style>
