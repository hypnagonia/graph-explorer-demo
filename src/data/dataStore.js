import { readable } from 'svelte/store';
import { csv } from 'd3-fetch';
import Papa from 'papaparse'
import seedrandom from 'seedrandom';
const nodesPath = 'data/engagement_nodes_positions.csv';
const edgesPath = 'data/engagement_edges.csv';
const resultsPath = 'data/results.json'; // obsolete
const inputsPath = 'data/inputs.csv';
const snapsPath = 'data/snaps.jsonp';
const peersPath = 'data/peers.jsonp';

const random = seedrandom('hello3')

const snapLabels = {
  '0': 'Insufficient Reviews',
  '1': 'Endorsed',
  '2': 'In Review',
  '3': 'Reported'
}
const peerLabels = {
  '-1': 'Distrusted',
  '0': '-',
  '1': 'Highly Trusted',
}

const getInputCSV = async () => {
  const response = await fetch(inputsPath);
  const csvData = await response.text();

  return Papa.parse(csvData, {
    header: true,
    delimiter: ";",
  }).data
    .filter(o => !!o.id)
    .map(o => {
      const schema_value = JSON.parse(o.schema_value)
      const issuer = schema_value.issuer
      const attestee = schema_value.credentialSubject.id

      return schema_value
    })
}

const getRecords = async () => {
  const snapsRaw = await fetch(snapsPath).then(r => r.text())
  const snaps = snapsRaw.split('\n').map(e => {

    try {
      return JSON.parse(e)
    } catch (err) {
      return false
    }
  }).filter(e => e)
  const peersRaw = await fetch(peersPath).then(r => r.text())
  const peers = peersRaw.split('\n').map(e => {

    try {
      return JSON.parse(e)
    } catch (err) {
      return false
    }
  }).filter(e => e)

  return snaps.concat(peers)
}

getRecords()

export const nodes = readable([], (set) => {
  getRecords()
    .then(async (res) => {

      const res2 = await getInputCSV()

      const entities = {}
      const attestationIssuedCount = {}
      const attestationReceivedCount = {}

      const updateCount = (dict, id) => {
        if (!dict[id]) {
          dict[id] = 1
        } else {
          dict[id] = dict[id] + 1
        }
      }

      res2.forEach(e => {
        entities[e.credentialSubject.id] = e
        entities[e.issuer] = true

        updateCount(attestationReceivedCount, e.credentialSubject.id)
        updateCount(attestationIssuedCount, e.issuer)
      })

      res.forEach(e => {
        entities[e.credentialSubject.id] = e
        entities[e.issuer] = true
        updateCount(attestationReceivedCount, e.credentialSubject.id)
        updateCount(attestationIssuedCount, e.issuer)
      })

      const points = Object.keys(entities).map(o => {
        const attestation = entities[o].id ? entities[o] : null

        let id = attestation ? attestation.credentialSubject.id : o;
        let score = attestation ? (attestation.credentialSubject.trustScore.value) : 0
        let rank = attestation ? (attestation.credentialSubject.trustScore.confidence || 0) : 0
        let isSnap = id.indexOf('snap') !== -1

        let label_badge_id = '' + (attestation ? (attestation.credentialSubject.trustScore.result || '0') : '0')
        let label_badge = isSnap ? snapLabels[label_badge_id] : peerLabels[label_badge_id]

        return {
          id,
          label: id,
          score,
          rank,
          isSnap,
          seed: 10000,
          curated: true,
          x: random(),
          y: random(),
          curated_degree_in: 500,
          curated_degree_out: 500,
          profile_age: 500,
          interacted_days: 500,
          label_badge,
          attestationIssuedCount: attestationIssuedCount[id] || 0,
          attestationReceivedCount: attestationReceivedCount[id] || 0
        }
      })


      const filteredPoints = points
      return filteredPoints
    })
    .then((d) => {
      set(d);
    });
});


export const edges = readable([], (set) => {
  getRecords()
    .then(async (res) => {

      const res2 = await getInputCSV()

      const entities = res2.map(e => {
        let target = e.credentialSubject.id
        let source = e.issuer
        let id = `${source}-${target}`

        let trustworthiness = e.credentialSubject.trustworthiness ? e.credentialSubject.trustworthiness[0].level : 0
        let currentStatus = e.credentialSubject.currentStatus ? (e.credentialSubject.currentStatus === 'Endorsed' ? 1 : -1) : 0
        let weight = Math.max(trustworthiness + currentStatus, 1)

        return {
          target,
          source,
          id,
          weight
        }
      })

      const uniqueEntities = Object.values(entities.reduce((acc, o) => {
        acc[o.id] = o
        return acc
      }, {}))

      return uniqueEntities
    })
    .then((d) => {
      set(d);
    });
});
