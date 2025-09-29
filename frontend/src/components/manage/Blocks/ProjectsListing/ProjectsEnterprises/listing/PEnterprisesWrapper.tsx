'use client'

import { useContext, useRef, useState } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import PEnterpriseCreateWrapper from '../create/PEnterpriseCreateWrapper'
import PEnterprisesTable from './PEnterprisesTable'
import { useGetProjectEnterprises } from '../../hooks/useGetProjectEnterprises'

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material'

export default function PEnterprisesWrapper({
  enterprises,
  mode,
}: {
  enterprises: ReturnType<typeof useGetProjectEnterprises>
  mode: string
}) {
  const form = useRef<any>()

  const { canEditProjectEnterprise } = useContext(PermissionsContext)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const onClose = () => {
    setIsDialogOpen(false)
  }

  return (
    <>
      {canEditProjectEnterprise && mode === 'edit' && (
        <div className="flex">
          <Button
            className="mb-5 ml-auto mt-2 h-10 px-4 py-2 shadow-none"
            size="large"
            variant="contained"
            onClick={() => {
              setIsDialogOpen(true)
            }}
          >
            Add enterprise
          </Button>
        </div>
      )}
      <form ref={form}>
        <PEnterprisesTable {...{ enterprises }} />
      </form>
      <Dialog
        open={isDialogOpen}
        onClose={onClose}
        fullWidth={true}
        maxWidth="xl"
      >
        <DialogTitle>Add enterprise</DialogTitle>
        <DialogContent>
          <PEnterpriseCreateWrapper />
        </DialogContent>
        <DialogActions>
          <Button
            className="hover:bg-white hover:text-primary"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            className="bg-primary text-white hover:text-mlfs-hlYellow"
            // onClick={handleSave}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
