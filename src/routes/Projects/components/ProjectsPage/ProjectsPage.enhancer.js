import { compose } from 'redux'
import { connect } from 'react-redux'
import { LIST_PATH, RUNS_PATH, PROJECTS_DATA_PATH } from 'constants'
import { withHandlers, withStateHandlers, pure } from 'recompose'
import { firestoreConnect } from 'react-redux-firebase'
import { withNotifications } from 'modules/notification'
import { withRouter, spinnerWhileLoading } from 'utils/components'
import { UserIsAuthenticated } from 'utils/router'
import { withChildren } from 'enhancers'
import { getOrderedProjects } from 'selectors'

export default compose(
  // redirect to /login if user is not logged in
  UserIsAuthenticated,
  // Map auth uid from state to props
  connect(({ firebase: { auth: { uid } } }) => ({ uid })),
  // Wait for uid to exist before going further
  spinnerWhileLoading(['uid']),
  withChildren,
  // Create listeners for data from Firestore results go into redux state
  firestoreConnect(({ params, uid }) => [
    // Listener for projects created by the current user
    {
      collection: PROJECTS_DATA_PATH,
      where: ['createdBy', '==', uid],
      storeAs: 'myProjects'
    },
    // Listener for projects the current user is a collaborator on
    {
      collection: PROJECTS_DATA_PATH,
      where: [`collaborators.${uid}`, '==', true]
    }
  ]),
  // Map projects from state to props
  connect((state, props) => ({
    projects: getOrderedProjects(state, props)
  })),
  // Show loading spinner while projects and collabProjects are loading
  spinnerWhileLoading(['projects']),
  // Add props.router
  withRouter,
  // Add props.showError and props.showSuccess
  withNotifications,
  // Add state and state handlers as props
  withStateHandlers(
    // Setup initial state
    ({ initialDialogOpen = false }) => ({
      newDialogOpen: initialDialogOpen
    }),
    // Add state handlers as props
    {
      toggleDialog: ({ newDialogOpen }) => () => ({
        newDialogOpen: !newDialogOpen
      })
    }
  ),
  // Add handlers as props
  withHandlers({
    addProject: props => newInstance => {
      const { firestore, uid, showError, showSuccess, toggleDialog } = props
      if (!uid) {
        return showError('You must be logged in to create a project')
      }
      toggleDialog()
      return firestore
        .add(
          { collection: 'projects' },
          {
            ...newInstance,
            createdBy: uid,
            createdAt: firestore.FieldValue.serverTimestamp()
          }
        )
        .then(() => {
          showSuccess('Project added successfully')
        })
        .catch(err => {
          console.error('Error:', err) // eslint-disable-line no-console
          showError(err.message || 'Could not add project')
          return Promise.reject(err)
        })
    },
    deleteProject: props => projectId => {
      const { firestore, showError, showSuccess } = props
      return firestore
        .delete({ collection: 'projects', doc: projectId })
        .then(() => showSuccess('Project deleted successfully'))
        .catch(err => {
          console.error('Error:', err) // eslint-disable-line no-console
          showError(err.message || 'Could not delete project')
          return Promise.reject(err)
        })
    },
    goToProject: ({ router }) => projectId => {
      router.push(`${LIST_PATH}/${projectId}/${RUNS_PATH}`)
    }
  }),
  pure // shallow equals comparison on props (prevent unessesary re-renders)
)
