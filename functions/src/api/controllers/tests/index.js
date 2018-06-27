import express from 'express'
import admin from 'firebase-admin'
const router = express.Router()

/**
 * Create body of request to create a VM on Google Compute Engine
 * @param  {[type]} cloudProjectId [description]
 * @param  {[type]} cloudZone      [description]
 * @return {[type]}                [description]
 */
function createRequestBody({ cloudProjectId, cloudZone }) {
  return {
    kind: 'compute#instance',
    name: 'instance-from-client',
    zone: `projects/${cloudProjectId}/zones/${cloudZone}`,
    machineType: `projects/${cloudProjectId}/zones/${cloudZone}/machineTypes/g1-small`,
    metadata: {
      kind: 'compute#metadata',
      items: [
        {
          key: 'gce-container-declaration',
          value:
            'spec:\n  containers:\n    - name: barback-template\n      image: gcr.io/barista-836b4/barback\n      stdin: false\n      tty: false\n  restartPolicy: Never\n\n# This container declaration format is not public API and may change without notice. Please\n# use gcloud command-line tool or Google Cloud Console to run Containers on Google Compute Engine.'
        }
      ]
    },
    tags: {
      items: []
    },
    disks: [
      {
        kind: 'compute#attachedDisk',
        type: 'PERSISTENT',
        boot: true,
        mode: 'READ_WRITE',
        autoDelete: true,
        deviceName: 'barback-template-1',
        initializeParams: {
          sourceImage:
            'projects/cos-cloud/global/images/cos-stable-67-10575-55-0',
          diskType: `projects/${cloudProjectId}/zones/${cloudZone}/diskTypes/pd-standard`,
          diskSizeGb: '10'
        }
      }
    ],
    canIpForward: false,
    networkInterfaces: [
      {
        kind: 'compute#networkInterface',
        // DO NOT ADD ZONE HERE - IT IS DIFFERENT
        subnetwork: `projects/${cloudProjectId}/regions/us-west1/subnetworks/default`,
        accessConfigs: [
          {
            kind: 'compute#accessConfig',
            name: 'External NAT',
            type: 'ONE_TO_ONE_NAT',
            networkTier: 'PREMIUM'
          }
        ],
        aliasIpRanges: []
      }
    ],
    description: '',
    labels: {
      'container-vm': 'cos-stable-67-10575-55-0'
    },
    scheduling: {
      preemptible: true,
      onHostMaintenance: 'TERMINATE',
      automaticRestart: false
    },
    deletionProtection: false,
    serviceAccounts: [
      {
        email: 'functions-dev-2@barista-836b4.iam.gserviceaccount.com',
        scopes: [
          'https://www.googleapis.com/auth/devstorage.read_only',
          'https://www.googleapis.com/auth/logging.write',
          'https://www.googleapis.com/auth/monitoring.write',
          'https://www.googleapis.com/auth/servicecontrol',
          'https://www.googleapis.com/auth/service.management.readonly',
          'https://www.googleapis.com/auth/trace.append'
        ]
      }
    ]
  }
}

/**
 * Run tests by invoking mocha programatically
 * @param req - Express HTTP Request
 * @param res - Express HTTP Response
 */
async function runTests(req, res) {
  const instanceTemplateName = 'barback-template'
  const cloudProjectId = process.env.GCLOUD_PROJECT || 'barista-836b4'
  const cloudZone = 'us-west1-b'
  const {
    environment: baristaEnvironment = 'B2rKSXXOtyF5JBzXeI6k',
    projectId: baristaProjectId = 'EJrWyFiygj6y3g2FfZh7'
  } = req.body
  // TODO: Fallback to local auth and call google API directly instead of
  // getting service account stored in Firestore
  await admin
    .database()
    .ref('requests/callGoogleApi')
    .push({
      api: 'compute',
      method: 'POST',
      suffix: `projects/${cloudProjectId}/zones/${cloudZone}/instances?souceInstanceTemplate=global/instanceTemplates/${instanceTemplateName}`,
      projectId: baristaProjectId,
      environment: baristaEnvironment,
      body: createRequestBody({ cloudProjectId, cloudZone })
    })
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(`Test run started!`)
}

router.post('/run', runTests)

export default router
