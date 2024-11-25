import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'

import Link from '@ors/components/ui/Link/Link'

interface SubmissionExistsDialogProps {
  existingReportTitle: string
  href: string
  onCancel: () => void
}

function SubmissionExistsDialog(props: SubmissionExistsDialogProps) {
  const { existingReportTitle, href, onCancel } = props

  return (
    <Dialog
      aria-describedby="alert-dialog-description"
      aria-labelledby="alert-dialog-title"
      open={true}
      onClose={onCancel}
    >
      <DialogTitle id="alert-dialog-title">
        There is already a submission for {existingReportTitle}.
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          id="alert-dialog-description"
          className="text-pretty"
        >
          {
            'Click "View submission" to navigate to it or "Cancel" to choose another country or year.'
          }
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Link href={href} button>
          View submission
        </Link>
      </DialogActions>
    </Dialog>
  )
}

export default SubmissionExistsDialog
