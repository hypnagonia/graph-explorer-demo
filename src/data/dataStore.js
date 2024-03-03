import { readable } from 'svelte/store';
import Papa from 'papaparse'
import seedrandom from 'seedrandom';
import { ethers } from 'ethers'
const snapRegistryUrl = 'https://raw.githubusercontent.com/MetaMask/snaps-registry/main/src/registry.json'

const seed = 'hello'
const random = seedrandom(seed)
const randomWithParam = id => seedrandom(seed + id)

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
const backendUrl = 'https://k3l-mm-spd-dev.s3.us-west-2.amazonaws.com'
const params = new URLSearchParams(window.location.search)
export let snapshotId = params.get('snapshot')
const modes = [
  {
    text: 'Software security',
    id: 'SoftwareSecurity'
  }, {
    text: 'Software development',
    id: 'SoftwareDevelopment'
  }
]
const modeParam = params.get('mode')
export let mode

if (modes.map(a => a.id).includes(modeParam)) {
  mode = modes.find(a => a.id === modeParam)
} else {
  mode = modes[0]
}

export let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

const getSnapshotList = async () => {
  const res = await fetch(`${backendUrl}/api/scores/list.json`).then(r => r.json())

  const list = Object.keys(res)
    .map(key => {
      res[key].id = key
      return res[key]
    })
    .filter((a, i) => {
      const isSecurity = a.scope === mode.id
      return isSecurity
    })
    .map(a => {
      const ms = new Date(a.effectiveDate).getTime()
      a.effectiveDateMs = ms
      return a
    })
    .sort((a, b) => b.effectiveDateMs - a.effectiveDateMs)
  /*.filter((a, i) => {
    if (!arr[i - 1]) {
      return true
    }
    const diff = +arr[i] - +arr[i - 1]
    if (diff === 1) {
      return false
    }
 
    return true
  })*/
  return list
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
    o[e[0]] = e[1]
    return o
  }, {})

  return socials
}

const getInputData = () => {
  return fetch(`${backendUrl}/api/scores/indexer-scores`)
  // return fetch(`${backendUrl}/files/metamask-input.csv`)
}

const getScores = async () => {
  const list = await (getSnapshotListPromise || getSnapshotList())
  if (!snapshotId) {
    snapshotId = list[0].id
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
      snapshotId = list[0].id
    }

    let count = 0

    const csvParsedObject = Papa.parse(csvData, {
      header: false,
      //delimiter: ";",
      delimiter: ",",
    }).data
      .map(a => {
        return {
          schema_value: a[3],
          timestamp: +a[1],
          id: +a[0]
        }
      })
      .filter(o => !!o.id)
      .map(o => {
        const schema_value = JSON.parse(o.schema_value)
        schema_value.issuer = changeChainIdTo1(schema_value.issuer)
        schema_value.credentialSubject.id = changeChainIdTo1(schema_value.credentialSubject.id)

        //
        const date = new Date(o.timestamp)
        const timestamp = date.getTime()
        schema_value.isIncludedInScores = timestamp <= +snapshotId

        return { id: o.id, schema_value }
      })
      .filter(o => {
        if (o.schema_value.credentialSubject.trustworthiness) {
          const scopes = o.schema_value.credentialSubject.trustworthiness.map(t => t.scope)
          return scopes.includes(mode.text)
        }

        return true
      })
      // no snaps for development mode
      .filter(o => {
        if (o.schema_value.credentialSubject.id.indexOf('snap') !== -1 && mode.id === 'SoftwareDevelopment') {
          return false
        }

        return true
      })
      // make sure assertions are unique
      .reduce((o, a) => {
        o['' + a.id] = a.schema_value
        return o
      }, {})

    return Object.values(csvParsedObject)
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
      const issuers = {}
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
        issuers[e.issuer] = true
        e.credentialSubject.id = changeChainIdTo1(e.credentialSubject.id)
        entities[e.credentialSubject.id] = e

        entities[e.issuer] = entities[e.issuer] || true
        updateCount(attestationReceivedCount, e.credentialSubject.id)
        updateCount(attestationIssuedCount, e.issuer)
      })

      scores.forEach(e => {
        issuers[e.issuer] = true
        e.issuer = changeChainIdTo1(e.issuer)
        e.credentialSubject.id = changeChainIdTo1(e.credentialSubject.id)
        entities[e.credentialSubject.id] = entities[e.credentialSubject.id] ? { ...entities[e.credentialSubject.id], ...e } : e
        entities[e.issuer] = entities[e.issuer] || true
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
        const isIncludedInScores = attestation ? (attestation.isIncludedInScores || isSnap) : true
        // console.log('is',isIncludedInScores)
        let label
        if (isSnap) {
          let parsedChecksum = id.split('//').at(-1)
          label = snapMetaData[parsedChecksum] || id
        } else {
          let parsedAddress = id.split(':').at(-1)
          label = socials[parsedAddress] || id
        }

        const random = randomWithParam(id)
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
          attestationReceivedCount: attestationReceivedCount[id] || 0,
          isIncludedInScores
        }
      })

      console.log('total snaps', points.filter(a => a.isSnap).length)
      console.log('total users', points.filter(a => !a.isSnap).length)
      console.log('unique issuers', Object.keys(issuers).length)

      console.log('assertions for snaps', inputs.filter(e => e.credentialSubject.id.indexOf('snap') !== -1).length)
      console.log('assertions for peers', inputs.filter(e => e.credentialSubject.id.indexOf('snap') === -1).length)



      return points
    })
    .then((d) => {
      set(d);
    });
});

export const snapshotsAvailable = readable([], (set) => {
  (getSnapshotListPromise || getSnapshotList()).then(r => {
    set(r)
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

        if (mode.id === 'SoftwareDevelopment' && currentStatus === 0) {
          currentStatus = e.credentialSubject.trustworthiness.find(a => a.scope === mode.text).level
        }

        if (currentStatus === 0) {
          const honesty = e.credentialSubject.trustworthiness.find(a => a.scope === "Honesty")
          currentStatus = honesty ? honesty.level : currentStatus
        }

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
