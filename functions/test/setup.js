/* eslint-disable no-unused-vars */
process.env.NODE_ENV = 'test'

const chai = require('chai')
const sinon = require('sinon')
const functionsTest = require('firebase-functions-test')()
chai.use(require('sinon-chai'))

global.chai = chai
global.sinon = sinon
global.expect = chai.expect
global.assert = chai.assert
global.functionsTest = functionsTest
global.mockFunctionsConfig = (extraConfig = {}) =>
  functionsTest.mockConfig({
    firebase: {
      databaseURL: 'https://some-project.firebaseio.com'
    },
    service_account: {},
    encryption: {},
    algolia: {
      app_id: 'asdf',
      api_key: 'asdf'
    },
    email: {},
    ...extraConfig
  })

// Stub Firebase's functions.config() (default in test/setup.js)
mockFunctionsConfig()

// Stub Firebase's config environment var
process.env.FIREBASE_CONFIG = JSON.stringify({
  databaseURL: 'https://some-project.firebaseio.com',
  storageBucket: 'some-bucket.appspot.com'
})
