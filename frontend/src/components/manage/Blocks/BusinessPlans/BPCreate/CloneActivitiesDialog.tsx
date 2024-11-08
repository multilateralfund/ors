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

import { useStore } from '@ors/store'

import { useGetActivities } from '../useGetActivities'
import { useBPCreate } from './Provider/BPCreateProvider'

const CloneActivitiesDialogContent = (props: {
  results: ApiBPActivity[]
  setForm: (form: ApiEditBPActivity[]) => void
}) => {
  const { results = [], setForm } = props

  const ctx = useBPCreate()
  const yearEnd = ctx.yearRange.year_end

  const [show, setShow] = useState(results.length > 0)

  const handleCancel = () => {
    setShow(false)
  }

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
          value.is_after ? { ...value, year: yearEnd } : value,
        ),
      })),
    [commentTypes, results, yearEnd],
  )

  const handleLoad = () => {
    setForm(getFormattedActivities())
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

  const params = {
    agency_id: agencyId,
    year_end: ctx.yearRange.year_end - 1,
    year_start: ctx.yearRange.year_start - 1,
  }

  const { loaded, results } = useGetActivities(params)

  return loaded && <CloneActivitiesDialogContent {...props} results={results} />
}

export default CloneActivitiesDialog
