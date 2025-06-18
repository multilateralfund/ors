import { PendingEditType } from './BPEditTable'
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material'

const BPResetFieldsWarning = ({
  pendingEdit,
  setPendingEdit,
  updateFields,
}: {
  pendingEdit: PendingEditType
  setPendingEdit: (value: PendingEditType) => void
  updateFields: () => void
}) => {
  const handleUpdateFields = () => {
    updateFields()
    setPendingEdit(null)
  }

  const handleCancel = () => {
    setPendingEdit(null)
  }

  const textHelper = {
    project_cluster: {
      colName: 'cluster',
      affectedColsText: 'project type, sector and subsector',
    },
    project_type: {
      colName: 'project type',
      affectedColsText: 'sector and subsector',
    },
    sector: { colName: 'sector', affectedColsText: 'subsector' },
    subsector: { colName: 'subsector', affectedColsText: '' },
  }

  const field = pendingEdit?.field as keyof typeof textHelper

  const commonText = `will reset the ${textHelper[field]?.affectedColsText} as
    ${pendingEdit?.field === 'sector' ? 'it is' : 'they are'} no longer valid
    for the current selection.`

  const infoText = !pendingEdit?.isOtherValue ? (
    <>
      Changing the {textHelper[field]?.colName} {commonText}
    </>
  ) : (
    <>
      When adding a value which is not in the list, it will be converted to
      'Other'. Therefore, please ensure you mention the value in the Remarks
      field.
      {field !== 'subsector' && (
        <>
          <br />
          <br />
          This change {commonText}
        </>
      )}
    </>
  )

  return (
    <Dialog
      aria-describedby="alert-dialog-description"
      aria-labelledby="alert-dialog-title"
      open={!!pendingEdit}
      onClose={handleCancel}
    >
      <DialogTitle id="alert-dialog-title">
        {pendingEdit?.isOtherValue
          ? 'Added value will be converted'
          : 'Dependent data will be cleared'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          id="alert-dialog-description"
          className="text-pretty"
        >
          {infoText} Are you sure you want to continue?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>No</Button>
        <Button onClick={handleUpdateFields}>Yes</Button>
      </DialogActions>
    </Dialog>
  )
}

export default BPResetFieldsWarning
