import { derived } from 'svelte/store';
import { isEmpty, map, keyBy, forEach, filter, orderBy } from 'lodash-es';
import { extent } from 'd3';

import { nodes, edges } from './dataStore.js';
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
  showInteractionEdgesOutgoing
} from '../state/uiState.js';

//////////////
// stats

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
    showInteractionEdgesOutgoing
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
    $showInteractionEdgesOutgoing
  ]) => {
    if ($nodes.length === 0) {
      return [];
    }

    const nodesHaveSelection = $selectedNodeId !== '';
    const nodesAreSearched = $searchedNodeLabel !== '';

    return map($nodes, (d) => {
      const isIncluded =
        isIn(d.score, $minNodeScore, $maxNodeScore) &&
        isIn(d.interacted_days, $minNodeAge, $maxNodeAge) &&
        isIn(d.curated_degree_in, $minNodeDegreeIn, $maxNodeDegreeIn) &&
        isIn(d.curated_degree_out, $minNodeDegreeOut, $maxNodeDegreeOut);

      return {
        ...d,
        selected: nodesHaveSelection && $selectedNodeId === d.id,
        hidden:
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
        //hidden: false,
        marked: sourceNode.marked || targetNode.marked,
      };

      return edge
    });

    // console.log({filteredEdges: filteredEdges.filter(r => !r.hidden)})
    return filteredEdges
  }
);

export const edgesDetailsById = derived([edgesDetails], ([$edgesDetails]) => {
  if ($edgesDetails.length === 0) {
    return {};
  }

  const output = {};

  const addToDict = (d, k1, k2, v = 'f', node) => {
    if (d[k1] === undefined) {
      d[k1] = {};
    }
    if (d[k1][k2]) {
       d[k1][k2] = d[k1][k2] + v
       node.size = 1.2
     } else {
      d[k1][k2] = v
     } 
  }

  forEach($edgesDetails, (d) => {
    addToDict(output, d.source, d.target, 't', d)
    addToDict(output, d.target, d.source, 'f', d)
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
      } else if (!isSelected && edge && edge.indexOf('f') === -1 && !$showInteractionEdgesOutgoing) {
        isHidden = true
      } else if (!isSelected && edge && edge.indexOf('t') === -1 && !$showInteractionEdges) {
        isHidden = true
      } else if (!isSelected && !$showInteractionEdgesOutgoing && !$showInteractionEdges) {
        isHidden = true
      }

      /*
      const hideIncomingNormal = edge ? edge === -1 && !$showInteractionEdges : false
      const hideOutgoingNormal = edge ? edge === 1 && !$showInteractionEdgesOutgoing : false
      const hideIncomingReversed = !d.isSnap && (edgeReversed ? edgeReversed === 1 && !$showInteractionEdges : false)
      const hideOutgoingReversed = !d.isSnap && (edgeReversed ? edgeReversed === -1 && !$showInteractionEdgesOutgoing : false)

      const hideAll = (!$showInteractionEdges && !$showInteractionEdgesOutgoing && $selectedNodeId !== d.id)
      // || (!edge && !edgeReversed && $selectedNodeId !== d.id && !!selectedNodeId)

      const hideIncoming = hideIncomingNormal && (d.isSnap ? true : hideIncomingReversed)
      const hideOutgoing = hideOutgoingNormal && (d.isSnap ? true : hideOutgoingReversed)
      */

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

    // console.log({ filteredNodes: filteredNodes.filter(n => !n.hidden) })
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