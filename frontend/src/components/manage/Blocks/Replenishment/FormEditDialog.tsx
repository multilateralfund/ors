import { FormEvent, Fragment } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'

import { CancelButton, SubmitButton } from '@ors/components/ui/Button/Button'

import { FormDialogProps } from './types'

import { IoCloseCircle } from 'react-icons/io5'

export default function FormEditDialog(props: FormDialogProps) {
  const { children, onCancel, onSubmit, title } = props

  const handleKeyDown = (evt: any) => {
    if (evt.key === 'Enter') {
      evt.preventDefault()
    }
  }

  return (
    <Fragment>
      <Dialog
        open={true}
        PaperProps={{
          component: 'form',
          onSubmit: (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)

            if (onSubmit) {
              onSubmit(formData, event)
            }
            onCancel()
          },
          style: { borderRadius: 8 },
        }}
        onClose={onCancel}
        onKeyDown={handleKeyDown}
      >
        <DialogTitle>
          <div className="flex items-center justify-between py-4 text-secondary">
            <h3 className="m-0 text-xl">{title}</h3>
            <IoCloseCircle
              className="cursor-pointer transition-all hover:rotate-90"
              size={32}
              onClick={onCancel}
            />
          </div>
        </DialogTitle>
        <DialogContent>
          {children}
          <footer className="mt-8 flex w-full items-center justify-between border-x-0 border-b-0 border-t border-solid border-gray-200 pt-6">
            <CancelButton onClick={onCancel}>Cancel</CancelButton>
            <SubmitButton>Submit</SubmitButton>
          </footer>
        </DialogContent>
        <DialogActions></DialogActions>
      </Dialog>
    </Fragment>
  )
}
