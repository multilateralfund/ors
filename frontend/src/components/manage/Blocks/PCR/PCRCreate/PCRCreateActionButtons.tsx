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
import { useLocation } from 'wouter'

const PCRCreateActionButtons = ({ setIsLoading }: PCRActionButtons) => {
  const [_, setLocation] = useLocation()
  const { PCRData, pcrMetaproject } = useContext(PCRDataContext)

  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const createPCR = async () => {
    setIsLoading(true)

    try {
      const metaProjectId = pcrMetaproject.data?.id
      if (!metaProjectId) {
        throw new Error('PCR metaproject data is not loaded.')
      }

      await api('api/project-completion-reports/', {
        data: {
          meta_project_id: metaProjectId,
          pcr_projects: PCRData.summary_of_key_data.map(buildPCRProjectPayload),
        },
        method: 'POST',
      })
      enqueueSnackbar(<>PCR created successfully.</>, {
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
      <SubmitButton title="Create PCR" onSubmit={createPCR} className="!py-2" />
      {isCancelModalOpen && (
        <CancelWarningModal
          mode="PCR creation"
          isModalOpen={isCancelModalOpen}
          setIsModalOpen={setIsCancelModalOpen}
        />
      )}
    </div>
  )
}

export default PCRCreateActionButtons
