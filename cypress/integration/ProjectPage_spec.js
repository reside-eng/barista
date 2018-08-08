import { createSelector } from '../utils'

Cypress.on('uncaught:exception', hackToNotFailOnCancelledXHR)
Cypress.on('fail', hackToNotFailOnCancelledXHR)

function hackToNotFailOnCancelledXHR(err) {
  const realError =
    err.message.indexOf("Cannot set property 'aborted' of undefined") === -1
  if (realError) throw err
  else console.error(err) // eslint-disable-line no-console
}

describe('Projects Page', () => {
  let open // eslint-disable-line no-unused-vars
  before(() => {
    // Create a server to listen to requests sent out to Google Auth and Firestore
    cy.server()
      // Google get account info (stubbed)
      .route('POST', /identitytoolkit\/v3\/relyingparty\/getAccountInfo/)
      // .route('POST', /identitytoolkit\/v3\/relyingparty\/getAccountInfo/, Cypress.env('ACCOUNT_INFO_RESPONSE'))
      .as('getGoogleAccountInfo')
      // Google verify token request (stubbed)
      .route('POST', /identitytoolkit\/v3\/relyingparty\/verifyCustomToken/)
      // .route('POST', /identitytoolkit\/v3\/relyingparty\/verifyCustomToken/, Cypress.env('VERIFY_TOKEN_RESPONSE'))
      .as('verifyCustomFirebaseToken')
      .route('POST', /google.firestore.v1beta1.Firestore\/Write/)
      .as('addProject')
      .route('POST', /google.firestore.v1beta1.Firestore\/Listen/)
      .as('listenForProjects')
      .route('GET', /google.firestore.v1beta1.Firestore\/Listen/)
      .as('getProjectData')
      .window()
      .then(win => {
        open = cy.spy(cy.state('server').options, 'onOpen')
        return null
      })
    // Go to home page
    cy.visit('/')
    // Login using custom token
    cy.login()
    // Go to projects page
    cy.visit('/projects')
    // wait for responses to requests (Promise.all used since responses cancome back in different order)
    cy.wait('@listenForProjects')
  })

  describe('Add Project', () => {
    it('creates project when provided a valid name', () => {
      const newProjectTitle = 'Test project'
      cy.get(createSelector('new-project-tile'), { timeout: 8000 }).click()
      // Type name of new project into input
      cy.get(createSelector('new-project-name'))
        .find('input')
        .type(newProjectTitle)
      // Click on the new project button
      cy.get(createSelector('new-project-create-button')).click()
      // Wait for request to Firebase to add project to return
      cy.wait('@addProject')
      // Confirm first project tile has title passed to new project input
      cy.get(createSelector('project-tile-name'))
        .first()
        .should('have.text', newProjectTitle)
    })
  })

  describe('Delete Project', () => {
    it('allows project to be deleted by project owner', () => {
      // click on the more button
      cy.get(createSelector('project-tile-more'))
        .first()
        .click()
      cy.get(createSelector('project-tile-delete')).click()
      // Confirm that new project is not available
      cy.get(createSelector('new-project-name')).should('not.exist')
    })
  })
})