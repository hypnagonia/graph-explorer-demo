import { readable } from 'svelte/store';
import { csv } from 'd3-fetch';
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
const backendUrl = 'https://mm-api.k3l.io'

const params = new URLSearchParams(window.location.search)

const snapshotGetParam = params.get('snapshot')
export let snapshotId = snapshotGetParam

const getSnapshotList = async () => {
  const arr = await fetch(`${backendUrl}/api/scores`).then(r => r.json())
  arr.shift()
  return arr
}
let getSnapshotListPromise = getSnapshotList()

const getSnapMetaData = async () => {
  const {verifiedSnaps} = await fetch(snapRegistryUrl)
  .then(r => r.json())

  const names = {}
  Object.keys(verifiedSnaps).forEach(snapKey => {
    console.log({verifiedSnaps, snapKey})
    Object.keys(verifiedSnaps[snapKey].versions).forEach(versionNumber => {
      const name = verifiedSnaps[snapKey].metadata.name
      const checksum = verifiedSnaps[snapKey].versions[versionNumber].checksum

      names[checksum] = `${name} v${versionNumber}`
    })
  })
  return names
}
let getSnapMetaDataPromise = getSnapMetaData()


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
        // const issuer = schema_value.issuer
        // const attestee = schema_value.credentialSubject.id
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
  // const peersRaw = await fetch(peersPath).then(r => r.text())
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
    .then(async (res) => {

      const res2 = await (getInputCSVPromise || getInputCSV())
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

      res2.forEach(e => {
        e.issuer = changeChainIdTo1(e.issuer)
        e.credentialSubject.id = changeChainIdTo1(e.credentialSubject.id)
        entities[e.credentialSubject.id] = e

        entities[e.issuer] = entities[e.issuer] || true
        updateCount(attestationReceivedCount, e.credentialSubject.id)
        updateCount(attestationIssuedCount, e.issuer)
      })

      res.forEach(e => {
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
        let rank = attestation ? (attestation.credentialSubject.trustScore.confidence || 0) : 0
        let isSnap = id.indexOf('snap') !== -1

        let label_badge_id = '' + (attestation ? (attestation.credentialSubject.trustScore.result || '0') : '0')
        let label_badge = isSnap ? snapLabels[label_badge_id] : peerLabels[label_badge_id]

        let label 
        if (isSnap) {
          let parsedChecksum = id.split('//').slice(-1)[0]
          label = snapMetaData[parsedChecksum] || id
        } else {
          label = id
        }

        return {
          id,
          label,
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

export const snapshotsAvailable = readable([], (set) => {
  (getSnapshotListPromise || getSnapshotList()).then(r => {
    set(r.reverse())
  })
})

export const edges = readable([], (set) => {
  getRecords()
    .then(async (res) => {

      const res2 = await (getInputCSVPromise || getInputCSV())

      const entities = res2.map(e => {
        let target = e.credentialSubject.id
        let source = e.issuer
        let id = `${source}-${target}`

        let trustworthiness = e.credentialSubject.trustworthiness
          ? e.credentialSubject.trustworthiness.reduce((acc, o) => acc + o, 0)
          : 0

        let currentStatus = e.credentialSubject.currentStatus ? (e.credentialSubject.currentStatus === 'Endorsed' ? 1 : -1) : 0
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
// 153;2024-02-20T17:12:36.238Z;{"type":["VerifiableCredential","TrustCredential"],"proof":{"type":"EthereumEip712Signature2021","eip712":{"types":{"Proof":[{"name":"created","type":"string"},{"name":"proofPurpose","type":"string"},{"name":"type","type":"string"},{"name":"verificationMethod","type":"string"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"}],"Trustworthiness":[{"name":"scope","type":"string"},{"name":"level","type":"int8"},{"name":"reason","type":"string[]"}],"CredentialSubject":[{"name":"id","type":"string"},{"name":"trustworthiness","type":"Trustworthiness[]"}],"VerifiableCredential":[{"name":"@context","type":"string[]"},{"name":"type","type":"string[]"},{"name":"issuer","type":"string"},{"name":"credentialSubject","type":"CredentialSubject"},{"name":"issuanceDate","type":"string"},{"name":"proof","type":"Proof"}]},"domain":{"name":"VerifiableCredential","chainId":59144,"version":"1"},"primaryType":"VerifiableCredential"},"created":"2024-02-20T17:12:35.682Z","proofValue":"0x8ca2b20d700495abcd48076cd4f652bd62a240b4600843d7251ec7132aa65ace698b7bb731a977cdd20cb1e95b497b85d2ec933677d8445e4a72f3cb1d5eb0dd1b","proofPurpose":"assertionMethod","verificationMethod":"did:pkh:eip155:59144:0x6eCfD8252C19aC2Bf4bd1cBdc026C001C93E179D#blockchainAccountId"},"issuer":"did:pkh:eip155:59144:0x6eCfD8252C19aC2Bf4bd1cBdc026C001C93E179D","@context":["https://www.w3.org/2018/credentials/v2"],"issuanceDate":"2024-02-20T17:12:32.840Z","credentialSubject":{"id":"did:pkh:eip155:59144:0xc5fd29cC1a1b76ba52873fF943FEDFDD36cF46C6","trustworthiness":[{"level":0,"scope":"Software development","reason":[]},{"level":0,"scope":"Software security","reason":[]}]}}