import { useContext, useEffect } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRHeader from '../PCRSubmission/PCRHeader'
import PCRForm from '../PCRSubmission/PCRForm'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'

import { Redirect } from 'wouter'
import { map } from 'lodash'

const PCRCreateWrapper = () => {
  const { pcrMetaproject, agencyIds, setPCRData } = useContext(PCRDataContext)
  const { data, loading } = pcrMetaproject

  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

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
        causes_of_delay: [],
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
    clearUpdatedFields()
  }, [clearUpdatedFields])

  useVisibilityChange(updatedFields.size > 0)

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
