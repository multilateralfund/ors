import { useContext, useEffect } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRHeader from '../PCRSubmission/PCRHeader'
import PCRForm from '../PCRSubmission/PCRForm'
import useApi from '@ors/hooks/useApi'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'
import {
  PCRAlternativeTechnologyType,
  PCREnterpriseType,
  PCREquipmentType,
} from '../interfaces'

import { useParams } from 'wouter'

type PCRProjectResponse = {
  project_id: number
  funds_disbursed?: string | null
  planned_date_of_completion?: string | null
  alternative_technologies?: PCRAlternativeTechnologyType[]
  enterprises?: PCREnterpriseType[]
  equipments?: PCREquipmentType[]
}

type PCRResponse = {
  id: number
  meta_project_id: number
  submission_date: string | null
  pcr_projects: PCRProjectResponse[]
}

const emptyAlternativeTechnology = (): PCRAlternativeTechnologyType => ({
  substance_from: null,
  substance_to: null,
})

const emptyEnterprise = (): PCREnterpriseType => ({
  name: '',
  address: '',
})

const emptyEquipment = (): PCREquipmentType => ({
  name: '',
  description: '',
  disposal_date: '',
  disposal_type: null,
})

const ensureRows = <T,>(rows: T[] | undefined, fallback: () => T) =>
  rows && rows.length > 0 ? rows : [fallback()]

const PCREditWrapper = () => {
  const { pcr_id } = useParams<Record<string, string>>()
  const { pcrMetaproject, setPCRData } = useContext(PCRDataContext)
  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

  const pcr = useApi<PCRResponse>({
    options: {
      triggerIf: !!pcr_id,
      withStoreCache: false,
    },
    path: pcr_id ? `api/project-completion-reports/${pcr_id}/` : '',
    reactivePath: true,
  })

  useEffect(() => {
    const pcrData = pcr.data
    if (!pcrData) {
      return
    }

    setPCRData((prevData) => ({
      ...prevData,
      summary_of_key_data: pcrData.pcr_projects.map((pcrProject) => ({
        project_id: pcrProject.project_id,
        funds_disbursed: pcrProject.funds_disbursed ?? '',
        planned_date_of_completion:
          pcrProject.planned_date_of_completion ?? '',
        alternative_technologies: ensureRows(
          pcrProject.alternative_technologies,
          emptyAlternativeTechnology,
        ),
        enterprises: ensureRows(pcrProject.enterprises, emptyEnterprise),
        equipments: ensureRows(pcrProject.equipments, emptyEquipment),
      })),
    }))
    clearUpdatedFields()
  }, [clearUpdatedFields, pcr.data, setPCRData])

  useVisibilityChange(updatedFields.size > 0)

  const loading = pcr.loading || pcrMetaproject.loading || !pcr.loaded

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <PCRHeader mode="edit" />
      <PCRForm />
    </>
  )
}

export default PCREditWrapper
