import { readable } from 'svelte/store';
import Papa from 'papaparse'
import seedrandom from 'seedrandom';
import { ethers } from 'ethers'
const snapRegistryUrl = 'https://raw.githubusercontent.com/MetaMask/snaps-registry/main/src/registry.json'
const random = seedrandom('hello3')

const changeChainIdTo1 = did => {
  if (did.indexOf('snap') !== -1) {
    return did
  }

  const a = did.split(':')

  if (!isNaN(+a[3])) {
    a[3] = '1'
  }

  let lastElement = a.length - 1
  a[lastElement] = ethers.getAddress(a[lastElement])

  return a.join(':')
}

export const snapLabels = {
  '0': 'Insufficient Reviews',
  '1': 'Endorsed',
  '2': 'In Review',
  '3': 'Reported'
}
export const peerLabels = {
  '-1': 'Distrusted',
  '0': '-',
  '1': 'Highly Trusted',
}
const backendUrl = 'https://mm-api.k3l.io'
const params = new URLSearchParams(window.location.search)
const snapshotGetParam = params.get('snapshot')
export let snapshotId = snapshotGetParam

const getSnapshotList = async () => {
  const arr = await fetch(`${backendUrl}/api/scores`).then(r => r.json())
  arr.shift()
  return arr.filter((a, i) => {
    if (!arr[i - 1]) {
      return true
    }
    const diff = +arr[i] - +arr[i - 1]
    if (diff === 1) {
      return false
    }

    return true
  })
}
let getSnapshotListPromise = getSnapshotList()

const getSnapMetaData = async () => {
  const { verifiedSnaps } = await fetch(snapRegistryUrl)
    .then(r => r.json())

  const names = {}
  Object.keys(verifiedSnaps).forEach(snapKey => {
    Object.keys(verifiedSnaps[snapKey].versions).forEach(versionNumber => {
      const name = verifiedSnaps[snapKey].metadata.name
      const checksum = verifiedSnaps[snapKey].versions[versionNumber].checksum

      names[checksum] = `${name} v${versionNumber}`
    })
  })
  return names
}
let getSnapMetaDataPromise = getSnapMetaData()

const getSocialData = async () => {
  const res = await fetch(`${backendUrl}/files/social-db.csv`).then(r => r.text())

  const socials = Papa.parse(res, {
    header: false,
    delimiter: ";",
  }).data.reduce((o, e) => {
    console.log({e})
    o[e[0]] = e[1]
    return o
  }, {})

  return socials
}

const getInputData = () => {
  return fetch(`${backendUrl}/files/metamask-input.csv`)
}

const getScores = async () => {
  if (!snapshotId) {
    const list = await (getSnapshotListPromise || getSnapshotList())
    snapshotId = list[list.length - 1]
  }

  return Promise.all([
    fetch(`${backendUrl}/files/${snapshotId}/peer_scores.jsonl`).then(r => r.text()),
    fetch(`${backendUrl}/files/${snapshotId}/snap_scores.jsonl`).then(r => r.text())
  ])
}
let getScoresPromise = getScores()

const getInputCSV = async () => {
  const response = await getInputData()

  const run = async () => {
    const csvData = await response.text()

    if (!snapshotId) {
      const list = await (getSnapshotListPromise || getSnapshotList())
      snapshotId = list[list.length - 1]
    }

    return Papa.parse(csvData, {
      header: true,
      delimiter: ";",
    }).data
      .filter(o => {
        const date = new Date(o.timestamp)
        const timestamp = date.getTime()
        return timestamp <= +snapshotId
      })
      .filter(o => !!o.id)
      .map(o => {
        const schema_value = JSON.parse(o.schema_value)
        schema_value.issuer = changeChainIdTo1(schema_value.issuer)
        schema_value.credentialSubject.id = changeChainIdTo1(schema_value.credentialSubject.id)
        return schema_value
      })
  }

  return run()
}
let getInputCSVPromise = getInputCSV()


const getRecords = async () => {
  const [peersRaw, snapsRaw] = await (getScoresPromise || getScores())
  const snaps = snapsRaw.split('\n').map(e => {

    try {
      return JSON.parse(e)
    } catch (err) {
      return false
    }
  }).filter(e => e)
  const peers = peersRaw.split('\n').map(e => {
    try {
      return JSON.parse(e)
    } catch (err) {
      return false
    }
  }).filter(e => e)

  return snaps.concat(peers)
}

export const nodes = readable([], (set) => {
  getRecords()
    .then(async (scores) => {
      const inputs = await (getInputCSVPromise || getInputCSV())

      const socials = await getSocialData()
      const snapMetaData = await getSnapMetaDataPromise

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

      inputs.forEach(e => {
        e.issuer = changeChainIdTo1(e.issuer)
        e.credentialSubject.id = changeChainIdTo1(e.credentialSubject.id)
        entities[e.credentialSubject.id] = e

        entities[e.issuer] = entities[e.issuer] || true
        updateCount(attestationReceivedCount, e.credentialSubject.id)
        updateCount(attestationIssuedCount, e.issuer)
      })

      scores.forEach(e => {
        e.issuer = changeChainIdTo1(e.issuer)
        e.credentialSubject.id = changeChainIdTo1(e.credentialSubject.id)
        entities[e.credentialSubject.id] = e
        entities[e.issuer] = entities[e.issuer] || true
        updateCount(attestationReceivedCount, e.credentialSubject.id)
        updateCount(attestationIssuedCount, e.issuer)
      })

      const points = Object.keys(entities).map(o => {
        const attestation = entities[o].id ? entities[o] : null

        let id = attestation ? attestation.credentialSubject.id : o;
        let score = attestation ? (attestation.credentialSubject.trustScore.value) : 0
        let rank = attestation ? (attestation.credentialSubject.trustScore.rank || '-') : '-'
        
        let accuracy = attestation ? (attestation.credentialSubject.trustScore.accuracy || 1) : 1
        let isSnap = id.indexOf('snap') !== -1
        
        let label_badge_id = '' + (attestation ? (attestation.credentialSubject.trustScore.result || '0') : '0')
        let label_badge = isSnap ? snapLabels[label_badge_id] : peerLabels[label_badge_id]
        let confidence = (attestation ? (attestation.credentialSubject.trustScore.confidence || '-') : '-')

        let label
        if (isSnap) {
          let parsedChecksum = id.split('//').at(-1)
          label = snapMetaData[parsedChecksum] || id
        } else {
          let parsedAddress = id.split(':').at(-1)
          label = socials[parsedAddress] || id
        }

        return {
          id,
          label,
          score,
          rank,
          confidence,
          accuracy,
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

      return points
    })
    .then((d) => {
      set(d);
    });
});

export const snapshotsAvailable = readable([], (set) => {
  (getSnapshotListPromise || getSnapshotList()).then(r => {
    set(r.reverse())
  })
})

export const edges = readable([], (set) => {
  getRecords()
    .then(async (scores) => {

      const inputs = await (getInputCSVPromise || getInputCSV())

      const entities = inputs.map(e => {
        let target = e.credentialSubject.id
        let source = e.issuer
        let id = `${source}-${target}`

        let trustworthiness = e.credentialSubject.trustworthiness
          ? e.credentialSubject.trustworthiness.reduce((acc, o) => acc + o, 0)
          : 0

        let currentStatus = e.credentialSubject.currentStatus ? (e.credentialSubject.currentStatus === 'Endorsed' ? 1 : -1) : 0
        // todo peers
        let weight = currentStatus // trustworthiness > 0 ? 1 : trustworthiness < 0 ? -1 : 0

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
