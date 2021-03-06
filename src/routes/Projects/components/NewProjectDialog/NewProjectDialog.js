/* eslint-disable react/no-unused-prop-types */
import React from 'react'
import PropTypes from 'prop-types'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import Button from '@material-ui/core/Button'
import { Field } from 'redux-form'
import { TextField } from 'redux-form-material-ui'
import { required } from 'utils/form'

import classes from './NewProjectDialog.scss'

export const NewProjectDialog = ({
  open,
  onRequestClose,
  handleSubmit,
  pristine,
  reset,
  submitting,
  submit,
  closeAndReset
}) => (
  <Dialog open={open} onClose={onRequestClose} fullWidth maxWidth="xs">
    <DialogTitle id="new-title">New Project</DialogTitle>
    <DialogContent>
      <form onSubmit={handleSubmit} className={classes.inputs}>
        <Field
          name="name"
          component={TextField}
          label="Project Name"
          validate={[required]}
          data-test="new-project-name"
        />
        <Field
          name="computeProjectId"
          component={TextField}
          label="Compute Project Id"
          validate={[required]}
          data-test="compute-project-id"
        />
        <Field
          name="dockerfilePath"
          component={TextField}
          label="Path To Dockerfile"
          data-test="dockerfile-path"
        />
      </form>
    </DialogContent>
    <DialogActions>
      <Button
        color="secondary"
        disabled={submitting}
        onClick={closeAndReset}
        data-test="new-project-cancel-button">
        Cancel
      </Button>
      <Button
        color="primary"
        disabled={pristine || submitting}
        onClick={submit}
        data-test="new-project-create-button">
        Create
      </Button>
    </DialogActions>
  </Dialog>
)

NewProjectDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onRequestClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  closeAndReset: PropTypes.func.isRequired, // from enhancer (withHandlers)
  handleSubmit: PropTypes.func.isRequired, // from enhancer (reduxForm)
  pristine: PropTypes.bool.isRequired, // from enhancer (reduxForm)
  reset: PropTypes.func.isRequired, // from enhancer (reduxForm)
  submitting: PropTypes.bool.isRequired, // from enhancer (reduxForm)
  submit: PropTypes.func.isRequired // from enhancer (reduxForm)
}

export default NewProjectDialog
