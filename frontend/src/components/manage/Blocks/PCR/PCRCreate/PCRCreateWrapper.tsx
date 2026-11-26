import { useContext, useEffect } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRHeader from '../PCRSubmission/PCRHeader'
import PCRForm from '../PCRSubmission/PCRForm'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'

import { Redirect } from 'wouter'
import { map } from 'lodash'

const PCRCreateWrapper = () => {
  const {
    pcrMetaproject,
    pcrDefaultData,
    agencyIds,
    setPCRData,
    updatedSections,
    clearUpdatedSections,
  } = useContext(PCRDataContext)
  const { data, loading } = pcrMetaproject
  const impactIndicators = pcrDefaultData.data?.impact_indicators

  useEffect(() => {
    if (!data) return

    setPCRData((prevData) => ({
      ...prevData,
      results_assessment: map(agencyIds, (agency_id) => ({
        agency_id,
        overall_assessment_highlights: [],
      })),
      delay_causes: map(agencyIds, (agency_id) => ({
        agency_id,
        delay_clusters: [],
      })),
      learned_lessons: map(agencyIds, (agency_id) => ({
        agency_id,
        lessons: [],
      })),
      future_project_recommendations: map(agencyIds, (agency_id) => ({
        agency_id,
        recommendations: [],
      })),
      gender_mainstreaming: map(agencyIds, (agency_id) => ({
        agency_id,
        gender_mainstreamings: [],
      })),
      sdgs_contribution: map(agencyIds, (agency_id) => ({
        agency_id,
        sdg_applying: true,
        sdg_not_applying_explanation: '',
        goals: [],
      })),
      supporting_evidences: map(agencyIds, (agency_id) => ({
        agency_id,
        evidences: [],
      })),
    }))
  }, [data, agencyIds, setPCRData])

  useEffect(() => {
    setPCRData((prevData) => ({
      ...prevData,
      impact_indicators: impactIndicators ?? [],
    }))
  }, [impactIndicators, setPCRData])

  useEffect(() => {
    clearUpdatedSections()
  }, [clearUpdatedSections])

  useVisibilityChange(updatedSections.size > 0)

  if (data?.pcr_id) {
    return <Redirect to="/pcr" />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <PCRHeader mode="add" />
      <PCRForm mode="add" />
    </>
  )
}

export default PCRCreateWrapper
