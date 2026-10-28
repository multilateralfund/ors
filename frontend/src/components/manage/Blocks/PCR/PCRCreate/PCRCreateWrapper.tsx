import { useContext, useEffect } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRHeader from '../PCRSubmission/PCRHeader'
import PCRForm from '../PCRSubmission/PCRForm'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'

import { map, uniq } from 'lodash'
import { Redirect } from 'wouter'

const PCRCreateWrapper = () => {
  const { pcrMetaproject, setPCRData } = useContext(PCRDataContext)
  const { data, loading } = pcrMetaproject

  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

  const projects = data?.projects

  useEffect(() => {
    if (!projects) return

    const agencyIds = uniq(map(projects, 'agency_id'))

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
  }, [projects, setPCRData])

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
      <PCRForm />
    </>
  )
}

export default PCRCreateWrapper
