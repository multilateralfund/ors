import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material'

const BPDeleteActivityWarning = ({
  activityId,
  deleteErrors,
  setDeleteErrors,
  handleRemoveActivity,
}: {
  activityId: number
  deleteErrors: string[]
  setDeleteErrors: (value: string[]) => void
  handleRemoveActivity: (activity?: any) => void
}) => {
  const handleDeletion = () => {
    handleRemoveActivity()
    setDeleteErrors([])
  }

  const handleCancel = () => {
    setDeleteErrors([])
  }

  return (
    <Dialog
      aria-describedby="alert-dialog-description"
      aria-labelledby="alert-dialog-title"
      open={deleteErrors.length > 0}
      onClose={handleCancel}
    >
      <DialogTitle id="alert-dialog-title">
        Confirm activity removal
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          id="alert-dialog-description"
          className="text-pretty"
        >
          Activity with ID {activityId} is linked to a project and the link will
          be removed. Minimal activity information will remain on the project.
          Are you sure you want to continue?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>No</Button>
        <Button onClick={handleDeletion}>Yes</Button>
      </DialogActions>
    </Dialog>
  )
}

export default BPDeleteActivityWarning
