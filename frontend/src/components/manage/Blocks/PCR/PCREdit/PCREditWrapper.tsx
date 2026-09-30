import { useContext, useEffect, useMemo } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRHeader from '../PCRSubmission/PCRHeader'
import PCRForm from '../PCRSubmission/PCRForm'
import { initialOverviewData } from '../constants'
import {
  PCRResponse,
  PCROverviewData,
  PCRAlternativeTechnologyType,
  PCREnterpriseType,
  PCREquipmentType,
} from '../interfaces'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'
import useApi from '@ors/hooks/useApi'

import { filter, groupBy, keys, map, pick, uniq } from 'lodash'
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

  const groupDataByAgency = (data: Record<string, any>) =>
    groupBy(data, 'agency_id')

  useEffect(() => {
    const pcrData = pcr.data
    if (!pcrData) {
      return
    }

    const groupedActivities = groupDataByAgency(pcrData.activities)
    const resultsAssessment = map(agencyIds, (agency_id) => ({
      agency_id,
      activities: groupedActivities[agency_id] ?? [],
    }))

    const groupedProjectComponents = groupDataByAgency(
      pcrData.project_components,
    )

    const causesOfDelay = map(agencyIds, (agency_id) => ({
      agency_id,
      project_components: filter(
        groupedProjectComponents[agency_id],
        (pc) => pc.delay_causes.length > 0,
      ),
    }))

    const lessonsLearned = map(agencyIds, (agency_id) => ({
      agency_id,
      project_components: filter(
        groupedProjectComponents[agency_id],
        (pc) => pc.learned_lessons.length > 0,
      ),
    }))

    const groupedGenderMainstreamings = groupDataByAgency(
      pcrData.gender_mainstreamings,
    )
    const genderMainstreamings = map(agencyIds, (agency_id) => ({
      agency_id,
      gender_mainstreamings: groupedGenderMainstreamings[agency_id] ?? [],
    }))

    const groupedSdgsContribution = groupDataByAgency(
      pcrData.sustainable_development_goals,
    )
    const sdgsContribution = map(agencyIds, (agency_id) => ({
      agency_id,
      goals: groupedSdgsContribution[agency_id]?.[0]?.goals ?? [],
    }))

    const groupedSupportingEvidences = groupDataByAgency(
      pcrData.supporting_evidences,
    )
    const supportingEvidences = map(agencyIds, (agency_id) => ({
      agency_id,
      evidences: map(groupedSupportingEvidences[agency_id], (evidence) => ({
        ...evidence,
        link: evidence.file,
      })),
    }))

    setPCRData((prevData) => ({
      ...prevData,
      overview: pick(pcrData, keys(initialOverviewData)) as PCROverviewData,
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
      causes_of_delay: causesOfDelay,
      lessons_learned: lessonsLearned,
      gender_mainstreaming: genderMainstreamings,
      sdgs_contribution: sdgsContribution,
      supporting_evidences: supportingEvidences,
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
