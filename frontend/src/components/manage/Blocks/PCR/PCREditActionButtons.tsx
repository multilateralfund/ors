import { useState } from 'react'

import CancelWarningModal from '@ors/components/manage/Blocks/ProjectsListing/ProjectSubmission/CancelWarningModal'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import { PCRActionButtons } from './interfaces'
import { useStore } from '@ors/store'

import { enqueueSnackbar } from 'notistack'
import { Button } from '@mui/material'
import { useLocation } from 'wouter'

const PCREditActionButtons = ({ setIsLoading }: PCRActionButtons) => {
  const [_, setLocation] = useLocation()

  const { setInlineMessage } = useStore((state) => state.inlineMessage)
  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const editPCR = async () => {
    setIsLoading(true)

    try {
      setInlineMessage({
        type: 'success',
        message: 'PCR updated successfully.',
        redirectMessage: 'View PCR.',
      })
      enqueueSnackbar(<>PCR updated successfully.</>, {
        variant: 'success',
      })
      clearUpdatedFields()
    } catch (error) {
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onCancel = () => {
    if (updatedFields.size > 0) {
      setIsCancelModalOpen(true)
    } else {
      setLocation('/pcr')
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5">
      <CancelLinkButton title="Cancel" href={null} onClick={onCancel} />
      <Button
        className="px-4 py-2 shadow-none"
        variant="contained"
        size="large"
        onClick={editPCR}
      >
        Update PCR
      </Button>
      {isCancelModalOpen && setIsCancelModalOpen && (
        <CancelWarningModal
          mode="PCR updating"
          isModalOpen={isCancelModalOpen}
          setIsModalOpen={setIsCancelModalOpen}
        />
      )}
    </div>
  )
}

export default PCREditActionButtons
