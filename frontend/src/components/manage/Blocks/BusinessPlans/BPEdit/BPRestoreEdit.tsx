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

const BPRestoreEdit = (props: BPRestoreEditProps) => {
  const { localStorage, setForm } = props

  const storedData = localStorage.load()

  const [show, setShow] = useState(!!storedData)

  const handleCancel = () => {
    localStorage.clear()
    setShow(false)
  }

  const handleLoad = () => {
    setForm(storedData)
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
          Unsaved data exists for the current business plan, would you like to
          recover it?
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
