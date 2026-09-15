import { useContext, useState } from 'react'

import CancelWarningModal from '@ors/components/manage/Blocks/ProjectsListing/ProjectSubmission/CancelWarningModal'
import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { formatAgencyData, formatPayload, isSubmitDisabled } from '../utils'
import {
  PCRActionButtons,
  PCRSupportingEvidencesData,
  FormattedSupportingEvidencesData,
} from '../interfaces'
import { formatApiUrl } from '@ors/helpers'

import { enqueueSnackbar } from 'notistack'
import { useLocation } from 'wouter'
import { map, omit } from 'lodash'
import Cookies from 'js-cookie'

const PCRCreateActionButtons = ({ setIsLoading }: PCRActionButtons) => {
  const [_, setLocation] = useLocation()
  const {
    PCRData,
    errors,
    setErrors,
    pcrMetaproject,
    pcrDefaultData,
    ratingOptions,
  } = useContext(PCRDataContext)
  const metaProjectId = pcrMetaproject.data?.id
  const { supporting_evidences } = PCRData

  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const isSaveDisabled = !metaProjectId || isSubmitDisabled(errors)

  const createPCR = async () => {
    setIsLoading(true)

    try {
      if (!metaProjectId) {
        throw new Error('PCR metaproject data is not loaded.')
      }

      const formattedSupportingEvidence =
        formatAgencyData<PCRSupportingEvidencesData>(
          supporting_evidences,
          'evidences',
        ) as FormattedSupportingEvidencesData[]

      const supportingEvidencesData = map(
        formattedSupportingEvidence,
        (evidence) => omit(evidence, 'file'),
      )

      const payload = {
        meta_project_id: metaProjectId,
        ...formatPayload(pcrDefaultData, PCRData, ratingOptions),
        supporting_evidences: supportingEvidencesData,
      }

      const formData = new FormData()
      formData.append('metadata', JSON.stringify(payload))
      formattedSupportingEvidence.forEach((evidence) => {
        formData.append('files', evidence.file)
      })

      const csrftoken = Cookies.get('csrftoken')

      const response = await fetch(
        formatApiUrl('api/project-completion-reports/'),
        {
          body: formData,
          headers: { ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}) },
          credentials: 'include',
          method: 'POST',
        },
      )
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        setErrors(data)

        throw data ?? { message: 'An error occurred' }
      }

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
      <SubmitButton
        title="Create PCR"
        onSubmit={createPCR}
        isDisabled={isSaveDisabled}
        className="!py-2"
      />
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
