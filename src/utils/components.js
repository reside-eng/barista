import React, { Component } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import {
  pick,
  some,
  get,
  reduce,
  isFunction,
  toPath,
  size,
  isArray
} from 'lodash'
import { isLoaded, isEmpty } from 'react-redux-firebase'
import { mapProps, branch, renderComponent, setDisplayName } from 'recompose'
import LoadingSpinner from 'components/LoadingSpinner'

/**
 * Show a loading spinner when a condition is truthy. Used within
 * spinnerWhileLoading. Accepts a test function and a higher-order component.
 * @param  {Function} condition - Condition function for when to show spinner
 * @return {HigherOrderComponent}
 */
export function spinnerWhile(condition) {
  return branch(condition, renderComponent(LoadingSpinner))
}

/**
 * Show a loading spinner while props are loading . Checks
 * for undefined, null, or a value (as well as handling `auth.isLoaded` and
 * `profile.isLoaded`). **NOTE:** Meant to be used with props which are passed
 * as props from state.firebase using connect (from react-redux), which means
 * it could have unexpected results for other props
 * @example Spinner While Data Loading
 * import { compose } from 'redux'
 * import { connect } from 'react-redux'
 * import { firebaseConnect } from 'react-redux-firebase'
 *
 * const enhance = compose(
 *   firebaseConnect(['projects']),
 *   connect(({ firebase: { data: { projects } } })),
 *   spinnerWhileLoading(['projects'])
 * )
 *
 * export default enhance(SomeComponent)
 * @param  {Array} propNames - List of prop names to check loading for
 * @return {HigherOrderComponent}
 */
export function spinnerWhileLoading(propNames) {
  return spinnerWhile(props => some(propNames, name => !isLoaded(props[name])))
}

/**
 * HOC that shows a component while condition is true
 * @param  {Function} condition - function which returns a boolean indicating
 * whether to render the provided component or not
 * @param  {React.Component} component - React component to render if condition
 * is true
 * @return {HigherOrderComponent}
 */
export function renderWhile(condition, component) {
  return branch(condition, renderComponent(component))
}

/**
 * HOC that shows a component while any of a list of props loaded from Firebase
 * is empty (uses react-redux-firebase's isEmpty).
 * @param  {Array} propNames - List of prop names to check loading for
 * @param  {React.Component} component - React component to render if prop loaded
 * from Firebase is empty
 * @return {HigherOrderComponent}
 * @example
 * renderWhileEmpty(['todos'], () => <div>Todos Not Found</div>),
 */
export function renderWhileEmpty(propsNames, component) {
  return renderWhile(
    // Any of the listed prop name correspond to empty props (supporting dot path names)
    props =>
      some(propsNames, name => {
        const propValue = get(props, name)
        return (
          isLoaded(propValue) &&
          (isEmpty(propValue) || (isArray(propValue) && !size(propValue)))
        )
      }),
    component
  )
}

/**
 * HOC that shows a component while any of a list of props isEmpty
 * @param  {Array} listenerPaths - List of listener paths which to check for errors
 * withing Firestore
 * @param  {React.Component} component - React component to render if any of
 * the provied listener paths have errors
 * @return {HigherOrderComponent}
 */
export const renderIfError = (listenerPaths, component) =>
  compose(
    connect((state, props) => {
      const {
        firestore: { errors }
      } = state
      const listenerErrors = reduce(
        listenerPaths,
        (acc, listenerConfig) => {
          const listenerName = isFunction(listenerConfig)
            ? listenerConfig(state, props)
            : listenerConfig
          const listenerError = get(
            errors,
            `byQuery.${toPath(listenerName).join('/')}`
          )
          if (listenerError) {
            return acc.concat({ name: listenerName, error: listenerError })
          }
          return acc
        },
        []
      )
      return {
        listenerErrors,
        errorMessage: get(listenerErrors, '0.error.code')
      }
    }),
    renderWhile(
      // Any of the listed prop name correspond to empty props (supporting dot path names)
      ({ listenerErrors }) => listenerErrors.length,
      component
    ),
    setDisplayName('renderIfError')
  )

/**
 * HOC that logs props using console.log. Accepts an array list of prop names
 * to log, if none provided all props are logged. **NOTE:** Only props at
 * available to the HOC will be logged.
 * @example Log Single Prop
 * import { compose } from 'redux'
 * import { connect } from 'react-redux'
 * import { firebaseConnect } from 'react-redux-firebase'
 *
 * const enhance = compose(
 *   withProps(() => ({ projectName: 'test' })),
 *   logProps(['projectName']) // 'test' would be logged to console when SomeComponent is rendered
 * )
 *
 * export default enhance(SomeComponent)
 * @param  {Array} propNames - List of prop names to log. If none provided, all
 * are logged
 * @return {HigherOrderComponent}
 */
export function logProps(propNames, logName = '') {
  return mapProps(ownerProps => {
    /* eslint-disable no-console */
    console.log(
      `${logName} props:`,
      propNames ? pick(ownerProps, propNames) : ownerProps
    )
    /* eslint-enable no-console */
    return ownerProps
  })
}

/**
 * Function which creates a HOC which gets a variable
 * @param  {String} withVar - Name of variable to get from context
 * @return {Component} React Higher Order Component
 * @example Basic
 * export const withRouter = createWithFromContext('router')
 * // withRouter is an HOC that passes context.router as props.router
 */
export function createWithFromContext(withVar) {
  return WrappedComponent => {
    class WithFromContext extends Component {
      render() {
        const props = { [withVar]: this.context[withVar] }
        if (this.context.store && this.context.store.dispatch) {
          props.dispatch = this.context.store.dispatch
        }
        return <WrappedComponent {...this.props} {...props} />
      }
    }

    WithFromContext.contextTypes = {
      [withVar]: PropTypes.object.isRequired
    }

    return WithFromContext
  }
}

/**
 * HOC that adds router to props (from context)
 * @return {HigherOrderComponent}
 */
export const withRouter = createWithFromContext('router')

/**
 * HOC that adds store to props (from context)
 * @return {HigherOrderComponent}
 */
export const withStore = createWithFromContext('store')
