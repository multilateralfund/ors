import { useContext, useEffect, useMemo } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRHeader from '../PCRSubmission/PCRHeader'
import PCRForm from '../PCRSubmission/PCRForm'
import { initialActivitiesData, initialOverviewData } from '../constants'
import {
  PCRAlternativeTechnologyType,
  PCREnterpriseType,
  PCREquipmentType,
  PCRResponse,
} from '../interfaces'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'
import useApi from '@ors/hooks/useApi'

import { groupBy, keys, map, pick, uniq } from 'lodash'
import { Redirect, useParams } from 'wouter'

const emptyAlternativeTechnology = (): PCRAlternativeTechnologyType => ({
  substance_from: null,
  substance_to: null,
})

const emptyEnterprise = (): PCREnterpriseType => ({
  name: '',
  address: '',
  isDefault: true,
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
  const { updatedFields, clearUpdatedFields } = useUpdatedFields()
  const { pcrMetaproject, setPCRData } = useContext(PCRDataContext)
  const { data } = pcrMetaproject

  const pcr = useApi<PCRResponse>({
    options: {
      triggerIf: !!pcr_id,
      withStoreCache: false,
    },
    path: pcr_id ? `api/project-completion-reports/${pcr_id}/` : '',
    reactivePath: true,
  })

  const loading = pcr.loading || pcrMetaproject.loading || !pcr.loaded

  if (!loading && !data?.pcr_id) {
    return <Redirect to="/pcr" />
  }

  const agencyIds = useMemo(
    () => uniq(map(data?.projects, 'agency_id')),
    [data],
  )

  useEffect(() => {
    const pcrData = pcr.data
    if (!pcrData) {
      return
    }

    const groupedActivities = groupBy(pcrData.activities, 'agency_id')

    const resultsAssessment = map(agencyIds, (agency_id) => ({
      agency_id,
      activities: map(groupedActivities[agency_id], (activity) =>
        pick(activity, keys(initialActivitiesData)),
      ),
    }))

    setPCRData((prevData) => ({
      ...prevData,
      overview: {
        ...prevData.overview,
        ...pick(pcrData, keys(initialOverviewData)),
      },
      summary_of_key_data: pcrData.pcr_projects.map((pcrProject) => ({
        project_id: pcrProject.project_id,
        funds_disbursed: pcrProject.funds_disbursed ?? '',
        planned_date_of_completion: pcrProject.planned_date_of_completion ?? '',
        alternative_technologies: ensureRows(
          pcrProject.alternative_technologies,
          emptyAlternativeTechnology,
        ),
        enterprises: ensureRows(pcrProject.enterprises, emptyEnterprise),
        equipments: ensureRows(pcrProject.equipments, emptyEquipment),
      })),
      results_assessment: resultsAssessment,
    }))
    clearUpdatedFields()
  }, [clearUpdatedFields, pcr.data, agencyIds, setPCRData])

  useVisibilityChange(updatedFields.size > 0)

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
