import { writable } from 'svelte/store';
import { snapLabels, isMobile } from '../data/dataStore';
// nodes
export const hoveredNodeId = writable('');
export const selectedNodeId = writable('');
export const searchedNodeLabel = writable('');
export const showCuratedNodes = writable(true);
export const showInteractionNodes = writable(false);
export const nodesFilterMode = writable(true);

export const minNodeScore = writable(undefined);
export const maxNodeScore = writable(undefined);
export const minNodeAge = writable(undefined);
export const maxNodeAge = writable(undefined);
export const minNodeDegreeIn = writable(undefined);
export const maxNodeDegreeIn = writable(undefined);
export const minNodeDegreeOut = writable(undefined);
export const maxNodeDegreeOut = writable(undefined);
// edges
export const showInteractionEdges = writable(true);
export const showInteractionEdgesOutgoing = writable(true);

export const showSnapNodes = writable(true);
export const showUserNodes = writable(true);
export const showDeveloperNodes = writable(true);
export const showAuditorNodes = writable(true);

export const snapshotTimestamps = writable(['']);

export const snapLabelFilters = writable(Object.values(snapLabels).map(label => ({ label, value: true })))

const resizeWindow = () => {
    const { subscribe, set } = writable({
        x: 0,
        y: 0,
    })

    window.addEventListener('resize', (e) => {
        set({
            x: window.innerWidth,
            y: window.innerHeight,
        });
    })

    return {
        subscribe,
    }

}

export const resize = resizeWindow()


export const isMenuVisible = writable(false);