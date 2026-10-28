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

import { groupBy, keyBy, keys, map, pick, uniq } from 'lodash'
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

    const groupedActivities = groupDataByAgency(
      pcrData.overall_assessment_highlights,
    )
    const resultsAssessment = map(agencyIds, (agency_id) => ({
      agency_id,
      overall_assessment_highlights: groupedActivities[agency_id] ?? [],
    }))

    const groupedCausesOfDelay = groupDataByAgency(pcrData.delay_causes)

    const causesOfDelay = map(agencyIds, (agency_id) => ({
      agency_id,
      causes_of_delay: map(
        groupedCausesOfDelay[agency_id],
        ({ delay_cluster_id, root_causes_of_delay }) => ({
          delay_cluster_id,
          root_causes_of_delay: map(
            root_causes_of_delay,
            ({
              root_cause_id,
              description_roots_causes_of_delay,
              action_taken,
            }) => ({
              root_cause_id,
              description_roots_causes_of_delay,
              action_taken,
            }),
          ),
        }),
      ),
    }))

    const lessonsLearnedByAgency = keyBy(pcrData.learned_lessons, 'agency_id')

    const lessonsLearned = map(agencyIds, (agency_id) => ({
      agency_id,
      lessons: map(
        lessonsLearnedByAgency[agency_id]?.lessons,
        ({ lesson_id, description }) => ({ lesson_id, description }),
      ),
    }))

    const groupedRecommendations = groupDataByAgency(
      pcrData.future_project_recommendations,
    )
    const projectRecommendations = map(agencyIds, (agency_id) => ({
      agency_id,
      recommendations: groupedRecommendations[agency_id] ?? [],
    }))

    const groupedGenderMainstreamings = groupDataByAgency(
      pcrData.gender_mainstreamings,
    )

    const genderMainstreamings = map(agencyIds, (agency_id) => ({
      agency_id,
      gender_mainstreamings: map(
        groupedGenderMainstreamings[agency_id],
        ({ project_preparation, prefilled, qualitative_description }) => ({
          project_preparation,
          prefilled: prefilled ? 'Yes' : 'No',
          qualitative_description,
        }),
      ),
    }))

    const groupedSdgsContribution = groupDataByAgency(
      pcrData.sustainable_development_goals,
    )
    const sdgsContribution = map(agencyIds, (agency_id) => ({
      agency_id,
      sdg_applying: true,
      // sdg_applying: groupedSdgsContribution[agency_id]?.[0]?.sdg_applying,
      sdg_not_applying_explanation:
        groupedSdgsContribution[agency_id]?.[0]?.sdg_not_applying_explanation,
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
      delay_causes: causesOfDelay,
      learned_lessons: lessonsLearned,
      future_project_recommendations: projectRecommendations,
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
