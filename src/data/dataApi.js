import { derived } from 'svelte/store';
import { isEmpty, map, keyBy, forEach, filter, orderBy } from 'lodash-es';
import { extent } from 'd3';
import { nodes, edges, snapshotsAvailable } from './dataStore.js';
import {
  hoveredNodeId,
  selectedNodeId,
  searchedNodeLabel,
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
  showDeveloperNodes,
  showAuditorNodes,
  showInteractionEdgesOutgoing,
  snapLabelFilters
} from '../state/uiState.js';

//////////////
// stats


export const snapshots = derived([snapshotsAvailable], ([$snapshotsAvailable]) => {
  if ($snapshotsAvailable.length === 0) {
    return [];
  }
  console.log({ $snapshotsAvailable })
  return $snapshotsAvailable
});


export const nodesScoreDomain = derived([nodes], ([$nodes]) => {
  if ($nodes.length === 0) {
    return undefined;
  }
  return extent($nodes, (d) => +d.score);
});

export const nodesAgeDomain = derived([nodes], ([$nodes]) => {
  if ($nodes.length === 0) {
    return undefined;
  }
  return extent($nodes, (d) => +d.interacted_days);
});

export const nodesDegreeInDomain = derived([nodes], ([$nodes]) => {
  if ($nodes.length === 0) {
    return undefined;
  }
  return extent($nodes, (d) => +d.curated_degree_in);
});

export const nodesDegreeOutDomain = derived([nodes], ([$nodes]) => {
  if ($nodes.length === 0) {
    return undefined;
  }
  return extent($nodes, (d) => +d.curated_degree_out);
});

//////////////
// nodes

function isIn(v, start, end) {
  return v >= start && v <= end;
}

export const nodesFiltered = derived(
  [
    nodes,
    selectedNodeId,
    searchedNodeLabel,
    showCuratedNodes,
    showInteractionNodes,
    showSnapNodes,
    nodesFilterMode,
    minNodeScore,
    maxNodeScore,
    minNodeAge,
    maxNodeAge,
    minNodeDegreeIn,
    maxNodeDegreeIn,
    minNodeDegreeOut,
    maxNodeDegreeOut,
    showUserNodes,
    showDeveloperNodes,
    showAuditorNodes,
    showInteractionEdgesOutgoing,
    snapLabelFilters
  ],
  ([
    $nodes,
    $selectedNodeId,
    $searchedNodeLabel,
    $showCuratedNodes,
    $showInteractionNodes,
    $showSnapNodes,
    $nodesFilterMode,
    $minNodeScore,
    $maxNodeScore,
    $minNodeAge,
    $maxNodeAge,
    $minNodeDegreeIn,
    $maxNodeDegreeIn,
    $minNodeDegreeOut,
    $maxNodeDegreeOut,
    $showUserNodes,
    $showDeveloperNodes,
    $showAuditorNodes,
    $showInteractionEdgesOutgoing,
    $snapLabelFilters
  ]) => {
    if ($nodes.length === 0) {
      return [];
    }

    const nodesHaveSelection = $selectedNodeId !== '';
    const nodesAreSearched = $searchedNodeLabel !== '';
    const labelsFiltered = $snapLabelFilters.filter(r => !r.value).map(r => r.label)

    return map($nodes, (d) => {
      const isIncluded =
        isIn(d.score, $minNodeScore, $maxNodeScore) &&
        isIn(d.interacted_days, $minNodeAge, $maxNodeAge) &&
        isIn(d.curated_degree_in, $minNodeDegreeIn, $maxNodeDegreeIn) &&
        isIn(d.curated_degree_out, $minNodeDegreeOut, $maxNodeDegreeOut);

      const isLabelFiltered = d.isSnap 
      ? labelsFiltered.includes(d.label_badge)
      : false   
      return {
        ...d,
        selected: nodesHaveSelection && $selectedNodeId === d.id,
        hidden:
          isLabelFiltered ||
          (!$showSnapNodes && d.isSnap) ||
          (!$showAuditorNodes && !d.isSnap) ||
          (nodesAreSearched &&
            !d.label.toLowerCase().includes($searchedNodeLabel)) ||
          ($nodesFilterMode && !isIncluded),
        marked: !$nodesFilterMode && !isIncluded,
      };
    });
  }
);

export const nodesFilteredById = derived(
  [nodesFiltered],
  ([$nodesFiltered]) => {
    if ($nodesFiltered.length === 0) {
      return {};
    }
    return keyBy($nodesFiltered, 'id');
  }
);

export const nodesByLabel = derived([nodes], ([$nodes]) => {
  if ($nodes.length === 0) {
    return {};
  }
  return keyBy($nodes, 'label');
});

//////////////
// edges

export const edgesDetails = derived(
  [edges, nodesFilteredById, showInteractionEdges, selectedNodeId, showSnapNodes, showInteractionEdgesOutgoing],
  ([$edges, $nodesFilteredById, $showInteractionEdges, $selectedNodeId, $showSnapNodes, $showInteractionEdgesOutgoing]) => {
    if ($edges.length === 0 || isEmpty($nodesFilteredById)) {
      return [];
    }

    const nodesHaveSelection = $selectedNodeId !== '';

    const filteredEdges = map($edges, (d) => {
      // console.log({ d })
      const sourceNode = $nodesFilteredById[d.source];
      const targetNode = $nodesFilteredById[d.target];

      const hideIncoming = nodesHaveSelection ? $selectedNodeId === targetNode.id && !$showInteractionEdges : false
      const hideOutgoing = nodesHaveSelection ? $selectedNodeId === sourceNode.id && !$showInteractionEdgesOutgoing : false
      const edge = {
        ...d,
        hidden:
          hideIncoming ||
          hideOutgoing ||
          (nodesHaveSelection &&
            !sourceNode.selected &&
            !targetNode.selected) ||
          sourceNode.hidden ||
          targetNode.hidden,
          // d.weight === 0,
        marked: sourceNode.marked || targetNode.marked,
      };

      return edge
    });

    return filteredEdges
  }
);

export const edgesDetailsById = derived([edgesDetails, showInteractionEdges, showInteractionEdgesOutgoing],
  ([$edgesDetails, $showInteractionEdges, $showInteractionEdgesOutgoing]) => {
    if ($edgesDetails.length === 0) {
      return {};
    }

    const output = {};

    const addToDict = (d, k1, k2, v = 'f', edge) => {
      if (d[k1] === undefined) {
        d[k1] = {};
      }

      if (d[k1][k2]) {
        if (
          (
            d[k1][k2] === 't' && v === 'F'
            || d[k1][k2] === 'T' && v === 'f'
            || d[k1][k2] === 'f' && v === 'T'
            || d[k1][k2] === 'F' && v === 't'
          )
        ) {
          edge.bidirectional = d[k1][k2] + v
        } else {
          // edge.bidirectional = null
        }
        
        d[k1][k2] = d[k1][k2] + v
        edge.size = 1.2
      } else {
        d[k1][k2] = v
      }
    }

    forEach($edgesDetails, (d) => {
      addToDict(output, d.source, d.target, d.weight > 0 ? 'T' : 't', d)
      addToDict(output, d.target, d.source, d.weight > 0 ? 'F' : 'f', d)
    });

    return output;
  });

//////////////
// nodes

export const nodesDetails = derived(
  [nodesFiltered, selectedNodeId, edgesDetailsById, showInteractionEdges, showInteractionEdgesOutgoing],
  ([$nodes, $selectedNodeId, $edgesDetailsById, $showInteractionEdges, $showInteractionEdgesOutgoing]) => {
    if ($nodes.length === 0) {
      return [];
    }

    const nodesHaveSelection = $selectedNodeId !== '';

    const filteredNodes = map($nodes, (d) => {
      const edge = $edgesDetailsById[$selectedNodeId] && $edgesDetailsById[$selectedNodeId][d.id]

      let isHidden = false
      const isSelected = $selectedNodeId === d.id

      if (!edge && $selectedNodeId && !isSelected) {
        isHidden = true
      } else if (!isSelected && edge && (edge.indexOf('f') === -1 && edge.indexOf('F') === -1) && !$showInteractionEdgesOutgoing) {
        isHidden = true
      } else if (!isSelected && edge && (edge.indexOf('t') === -1 && edge.indexOf('T') === -1) && !$showInteractionEdges) {
        isHidden = true
      } else if (!isSelected && !$showInteractionEdgesOutgoing && !$showInteractionEdges) {
        isHidden = true
      }

      return {
        ...d,
        hidden:
          isHidden ||
          d.hidden ||
          (nodesHaveSelection &&
            $selectedNodeId !== d.id &&
            $edgesDetailsById[$selectedNodeId] &&
            $edgesDetailsById[$selectedNodeId][d.id] === undefined),
      };
    });

    return filteredNodes
  }
);

export const nodesList = derived([nodesDetails], ([$nodesDetails]) => {
  if ($nodesDetails.length === 0) {
    return [];
  }

  return map(
    filter($nodesDetails, (d) => !d.hidden),
    (d) => {
      return { id: d.id, label: d.label };
    }
  );
});

export const hoveredNodeDetails = derived(
  [nodesFilteredById, hoveredNodeId],
  ([$nodesFilteredById, $hoveredNodeId]) => {
    if (isEmpty($nodesFilteredById)) {
      return undefined;
    }
    return $nodesFilteredById[$hoveredNodeId];
  }
);

export const selectedNodeDetails = derived(
  [nodesFilteredById, selectedNodeId, edgesDetails],
  ([$nodesFilteredById, $selectedNodeId, $edgesDetails]) => {
    if (
      $selectedNodeId === '' ||
      $edgesDetails.length === 0 ||
      isEmpty($nodesFilteredById)
    ) {
      return undefined;
    }

    const edges = orderBy(
      filter($edgesDetails, (d) => d.target === $selectedNodeId),
      'weight',
      'desc'
    ); //

    return {
      ...$nodesFilteredById[$selectedNodeId],
      edges: map(edges, (d) => {
        return { ...d, source: $nodesFilteredById[d.source] };
      }),
    };
  }
);

export const isReady = derived(
  [
    nodesDetails,
    edgesDetails,
    nodesScoreDomain,
    nodesDegreeInDomain,
    nodesDegreeOutDomain,
  ],
  ([
    $nodesDetails,
    $edgesDetails,
    $nodesScoreDomain,
    $nodesDegreeInDomain,
    $nodesDegreeOutDomain,
  ]) => {
    return (
      $nodesDetails.length > 0 &&
      !isEmpty($edgesDetails) &&
      $nodesScoreDomain !== undefined &&
      $nodesDegreeInDomain !== undefined &&
      $nodesDegreeOutDomain !== undefined
    );
  }
);

export { nodes, edges };
