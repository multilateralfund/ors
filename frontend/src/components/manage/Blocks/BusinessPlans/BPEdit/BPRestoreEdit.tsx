import { useState } from 'react'

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'

import { BPRestoreEditProps } from '../types'
import { find, isEqual, omit, uniq } from 'lodash'

const BPRestoreEdit = (props: BPRestoreEditProps) => {
  const { children, localStorage, setForm, activitiesRef, results } = props

  const storedData = localStorage.load()

  const [show, setShow] = useState(!!storedData)

  const handleCancel = () => {
    localStorage.clear()
    setShow(false)
  }

  const getDiffActivities = (value: any) => [
    ...value
      .filter((activ: any) => {
        const match = find(results, { initial_id: activ.initial_id })
        return (
          !match || !isEqual(omit(activ, ['row_id']), omit(match, ['row_id']))
        )
      })
      .map((activ: any) => activ.initial_id),
  ]

  const handleLoad = () => {
    setForm(storedData)
    setShow(false)

    activitiesRef.current.edited = uniq([
      ...(getDiffActivities(storedData) || []),
      ...(activitiesRef.current.edited || []),
    ]).filter(Boolean)
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
          {children}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Discard recovery data</Button>
        <Button onClick={handleLoad}>Load recovery data</Button>
      </DialogActions>
    </Dialog>
  )
}

export default BPRestoreEdit
