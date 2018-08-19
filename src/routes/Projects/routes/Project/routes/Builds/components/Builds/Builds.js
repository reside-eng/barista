import React from 'react'
import PropTypes from 'prop-types'
import { map } from 'lodash'
import Typography from '@material-ui/core/Typography'
import Paper from '@material-ui/core/Paper'

export const Builds = ({ builds, buildStatuses, classes }) => (
  <div className={classes.root}>
    <Typography>Builds</Typography>
    <Paper className={classes.paper}>
      <pre>{JSON.stringify(buildStatuses, null, 2)}</pre>
    </Paper>
    <Paper className={classes.paper}>
      {map(builds, build => <pre>{JSON.stringify(build, null, 2)}</pre>)}
    </Paper>
  </div>
)

Builds.propTypes = {
  builds: PropTypes.array, // from enhancer (firestoreConnect + connect)
  buildStatuses: PropTypes.object,
  classes: PropTypes.object.isRequired // from enhancer (withStyles)
}

export default Builds
