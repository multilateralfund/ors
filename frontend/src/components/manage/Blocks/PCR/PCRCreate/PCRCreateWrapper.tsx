import { useContext, useEffect, useMemo } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRHeader from '../PCRSubmission/PCRHeader'
import PCRForm from '../PCRSubmission/PCRForm'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'

import { map, uniq } from 'lodash'

const PCRCreateWrapper = () => {
  const { pcrMetaproject, setPCRData } = useContext(PCRDataContext)
  const { data, loading } = pcrMetaproject

  const agencyIds = useMemo(
    () => uniq(map(data?.projects, 'agency_id')),
    [data],
  )
  const initialProjectComponentData = useMemo(
    () =>
      map(agencyIds, (agency_id) => ({
        agency_id,
        pcr_project_component: [],
      })),
    [agencyIds],
  )
  // to update
  const initialGenderMainstreamingData = useMemo(
    () =>
      map(agencyIds, (agency_id) => ({
        agency_id,
        project_phase: [
          { project_phase_id: 1, meets_criteria: true, description: '' },
          { project_phase_id: 2, meets_criteria: false, description: '' },
          { project_phase_id: 3, meets_criteria: true, description: '' },
          { project_phase_id: 4, meets_criteria: false, description: '' },
        ],
      })),
    [agencyIds],
  )
  const initialSdgsData = useMemo(
    () =>
      map(agencyIds, (agency_id) => ({
        agency_id,
        sdgs: [],
      })),
    [agencyIds],
  )

  useEffect(() => {
    setPCRData((prevData) => ({
      ...prevData,
      causes_of_delay: initialProjectComponentData,
      lessons_learned: initialProjectComponentData,
      gender_mainstreaming: initialGenderMainstreamingData,
      sdgs_contribution: initialSdgsData,
    }))
  }, [
    initialGenderMainstreamingData,
    initialProjectComponentData,
    initialSdgsData,
    setPCRData,
  ])

  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

  useEffect(() => {
    clearUpdatedFields()
  }, [clearUpdatedFields])

  useVisibilityChange(updatedFields.size > 0)

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
