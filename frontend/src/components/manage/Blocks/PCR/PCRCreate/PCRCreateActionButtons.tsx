import { useContext, useState } from 'react'

import CancelWarningModal from '@ors/components/manage/Blocks/ProjectsListing/ProjectSubmission/CancelWarningModal'
import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { api } from '@ors/helpers'
import {
  PCRActionButtons,
  PCRAlternativeTechnologyType,
  PCREnterpriseType,
  PCREquipmentType,
  PCRSummaryOfKeyDataType,
} from '../interfaces'

import { enqueueSnackbar } from 'notistack'
import { useLocation } from 'wouter'

type PCRSummaryProjectPayload = {
  project_id: number
  funds_disbursed?: string
  planned_date_of_completion?: string
  alternative_technologies?: PCRAlternativeTechnologyType[]
  enterprises?: PCREnterpriseType[]
  equipments?: PCREquipmentType[]
}

const hasText = (value: string) => value.trim() !== ''

const cleanNumber = (value: string) => {
  const cleanedValue = value.replace(/,/g, '').trim()
  return cleanedValue || undefined
}

const cleanDate = (value: string) => value.trim() || undefined

const cleanAlternativeTechnologies = (
  entries: PCRAlternativeTechnologyType[],
) =>
  entries.filter(
    (entry) => entry.substance_from !== null || entry.substance_to !== null,
  )

const cleanEnterprises = (entries: PCREnterpriseType[]) =>
  entries
    .map((entry) => ({
      name: entry.name.trim(),
      address: entry.address.trim(),
    }))
    .filter((entry) => hasText(entry.name) || hasText(entry.address))

const cleanEquipments = (entries: PCREquipmentType[]) =>
  entries
    .map((entry) => ({
      name: entry.name.trim(),
      description: entry.description.trim(),
      disposal_type: entry.disposal_type,
      disposal_date: entry.disposal_date,
    }))
    .filter(
      (entry) =>
        hasText(entry.name) ||
        hasText(entry.description) ||
        entry.disposal_type !== null ||
        hasText(entry.disposal_date),
    )

const buildPCRProjectPayload = (
  entry: PCRSummaryOfKeyDataType,
): PCRSummaryProjectPayload => {
  const payload: PCRSummaryProjectPayload = {
    project_id: entry.project_id,
  }
  const fundsDisbursed = cleanNumber(entry.funds_disbursed)
  const plannedDateOfCompletion = cleanDate(entry.planned_date_of_completion)
  const alternativeTechnologies = cleanAlternativeTechnologies(
    entry.alternative_technologies,
  )
  const enterprises = cleanEnterprises(entry.enterprises)
  const equipments = cleanEquipments(entry.equipments)

  if (fundsDisbursed) {
    payload.funds_disbursed = fundsDisbursed
  }
  if (plannedDateOfCompletion) {
    payload.planned_date_of_completion = plannedDateOfCompletion
  }
  if (alternativeTechnologies.length > 0) {
    payload.alternative_technologies = alternativeTechnologies
  }
  if (enterprises.length > 0) {
    payload.enterprises = enterprises
  }
  if (equipments.length > 0) {
    payload.equipments = equipments
  }

  return payload
}

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
