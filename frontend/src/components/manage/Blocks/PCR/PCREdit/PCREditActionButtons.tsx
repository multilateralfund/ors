import { useContext, useState } from 'react'

import CancelWarningModal from '@ors/components/manage/Blocks/ProjectsListing/ProjectSubmission/CancelWarningModal'
import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { api } from '@ors/helpers'
import { PCRActionButtons } from '../interfaces'
import { buildPCRProjectPayload } from '../utils'

import { enqueueSnackbar } from 'notistack'
import { useLocation, useParams } from 'wouter'

const PCREditActionButtons = ({ setIsLoading }: PCRActionButtons) => {
  const [_, setLocation] = useLocation()
  const { pcr_id } = useParams<Record<string, string>>()
  const { PCRData } = useContext(PCRDataContext)

  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const editPCR = async () => {
    setIsLoading(true)

    try {
      if (!pcr_id) {
        throw new Error('PCR id is not available.')
      }

      await api(`api/project-completion-reports/${pcr_id}/`, {
        data: {
          pcr_projects: PCRData.summary_of_key_data.map(buildPCRProjectPayload),
        },
        method: 'PATCH',
      })
      enqueueSnackbar(<>PCR updated successfully.</>, {
        variant: 'success',
      })
      clearUpdatedFields()
      setLocation('/pcr')
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
      <SubmitButton title="Update PCR" onSubmit={editPCR} className="!py-2" />
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
