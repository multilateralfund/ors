import { useState } from 'react'

import CancelWarningModal from '@ors/components/manage/Blocks/ProjectsListing/ProjectSubmission/CancelWarningModal'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import { PCRActionButtons } from '../interfaces'
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
        message: 'Updated PCR successfully.',
        redirectMessage: 'View PCR.',
      })

      enqueueSnackbar(<>Updated project successfully.</>, {
        variant: 'success',
      })

      clearUpdatedFields()

      return true
    } catch (error) {
      await handleErrors(error)
      return false
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
    <div className="container flex w-full flex-wrap justify-end gap-x-3 gap-y-2 px-0">
      <CancelLinkButton title="Cancel" href={null} onClick={onCancel} />
      <Button
        className="px-4 py-2 shadow-none"
        size="large"
        variant="contained"
        onClick={editPCR}
      >
        Update PCR
      </Button>
      {isCancelModalOpen && setIsCancelModalOpen && (
        <CancelWarningModal
          mode="project editing"
          isModalOpen={isCancelModalOpen}
          setIsModalOpen={setIsCancelModalOpen}
        />
      )}
    </div>
  )
}

export default PCREditActionButtons
