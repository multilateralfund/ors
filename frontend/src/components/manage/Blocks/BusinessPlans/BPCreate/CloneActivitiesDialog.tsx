import { ApiBPActivity, ApiEditBPActivity } from '@ors/types/api_bp_get'

import { useCallback, useState } from 'react'

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import { find, map } from 'lodash'
import { enqueueSnackbar } from 'notistack'

import { useStore } from '@ors/store'

import { useGetActivities } from '../useGetActivities'
import { useBPCreate } from './Provider/BPCreateProvider'

const CloneActivitiesDialogContent = (props: {
  error: any
  results: ApiBPActivity[]
  setForm: (form: ApiEditBPActivity[]) => void
}) => {
  const { error, results = [], setForm } = props

  const ctx = useBPCreate()
  const agencyName = ctx.reportingAgency?.name
  const { year_end, year_start } = ctx.yearRange || {}

  const showDialog = results.length > 0 || error
  const [show, setShow] = useState(showDialog)

  const bpSlice = useStore((state) => state.businessPlans)
  const commentTypes = bpSlice.commentTypes.data

  const getFormattedActivities = useCallback(
    () =>
      map(results, (activity, index) => ({
        ...activity,
        comment_types: map(
          activity.comment_types,
          (comment_type) =>
            find(commentTypes, (comm_type) => comm_type.name === comment_type)
              ?.id,
        ),
        row_id: index,
        values: map(activity.values, (value) =>
          value.is_after ? { ...value, year: year_end } : value,
        ),
      })),
    [commentTypes, results, year_end],
  )

  const handleLoad = () => {
    if (error) {
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    } else {
      enqueueSnackbar(
        <>
          Loaded activities for {agencyName} {year_start}-{year_end}.
        </>,
        {
          variant: 'success',
        },
      )
    }

    setForm(getFormattedActivities())
    setShow(false)
  }

  const handleCancel = () => {
    setShow(false)
  }

  return (
    <Dialog
      aria-describedby="alert-dialog-description"
      aria-labelledby="alert-dialog-title"
      open={show}
      onClose={handleCancel}
    >
      <DialogTitle id="alert-dialog-title">Recovery data available</DialogTitle>
      <DialogContent>
        <DialogContentText
          id="alert-dialog-description"
          className="text-pretty"
        >
          Deferred activities exist from the previous business plan, would you
          like to load them?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleLoad}>Load recovery data</Button>
        <Button onClick={handleCancel}>Discard recovery data</Button>
      </DialogActions>
    </Dialog>
  )
}

const CloneActivitiesDialog = (props: {
  setForm: (form: ApiEditBPActivity[]) => void
}) => {
  const ctx = useBPCreate()
  const agencyId = ctx.reportingAgency?.id
  const { year_end, year_start } = ctx.yearRange || {}

  const params = {
    agency_id: agencyId,
    year_end: year_end - 1,
    year_start: year_start - 1,
  }

  const { error, loaded, results } = useGetActivities(params)

  return (
    (loaded || error) && (
      <CloneActivitiesDialogContent
        {...props}
        error={error}
        results={results}
      />
    )
  )
}

export default CloneActivitiesDialog
