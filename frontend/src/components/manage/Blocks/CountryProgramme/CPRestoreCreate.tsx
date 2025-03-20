import { useState } from 'react'

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import { isEmpty } from 'lodash'

import { CreateLocalStorageType } from './useLocalStorage'

interface CPRestoreCreateProps {
  localStorage: CreateLocalStorageType
  onRestore: (storedData: any) => void
}

function CPRestoreCreate(props: CPRestoreCreateProps) {
  const { localStorage, onRestore } = props

  const storedData = localStorage.load()

  const [show, setShow] = useState(!isEmpty(storedData))

  function handleCancel() {
    localStorage.clear()
    setShow(false)
  }

  function handleLoad() {
    onRestore(storedData)
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
          Recovery data exists for {storedData?.country?.label} -{' '}
          {storedData?.year}, would like to load it and continue where you left
          off?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Discard recovery data</Button>
        <Button onClick={handleLoad}>Load recovery data</Button>
      </DialogActions>
    </Dialog>
  )
}

export default CPRestoreCreate
