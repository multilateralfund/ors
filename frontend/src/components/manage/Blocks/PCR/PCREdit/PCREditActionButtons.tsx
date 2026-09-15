import { useContext, useState } from 'react'

import CancelWarningModal from '@ors/components/manage/Blocks/ProjectsListing/ProjectSubmission/CancelWarningModal'
import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { formatPayload, isSubmitDisabled } from '../utils'
import { PCRActionButtons } from '../interfaces'
import { formatApiUrl } from '@ors/helpers'

import { useLocation, useParams } from 'wouter'
import { enqueueSnackbar } from 'notistack'
import Cookies from 'js-cookie'

const PCREditActionButtons = ({ setIsLoading }: PCRActionButtons) => {
  const [_, setLocation] = useLocation()
  const { pcr_id } = useParams<Record<string, string>>()
  const { PCRData, errors, setErrors, pcrDefaultData, ratingOptions } =
    useContext(PCRDataContext)

  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const isSaveDisabled = isSubmitDisabled(errors)

  const editPCR = async () => {
    setIsLoading(true)

    try {
      if (!pcr_id) {
        throw new Error('PCR id is not available.')
      }

      const payload = {
        ...formatPayload(pcrDefaultData, PCRData, ratingOptions),
      }

      const formData = new FormData()
      formData.append('metadata', JSON.stringify(payload))

      const csrftoken = Cookies.get('csrftoken')

      const response = await fetch(
        formatApiUrl(`api/project-completion-reports/${pcr_id}/`),
        {
          body: formData,
          headers: { ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}) },
          credentials: 'include',
          method: 'PATCH',
        },
      )
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setErrors(data)

        throw data ?? { message: 'An error occurred' }
      }
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
      <SubmitButton
        title="Update PCR"
        onSubmit={editPCR}
        isDisabled={isSaveDisabled}
        className="!py-2"
      />
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
