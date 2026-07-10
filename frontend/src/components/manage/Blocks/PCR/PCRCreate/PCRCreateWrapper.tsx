import { useContext, useEffect, useMemo } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRHeader from '../PCRSubmission/PCRHeader'
import PCRForm from '../PCRSubmission/PCRForm'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'

import { map, uniq } from 'lodash'

const PCRCreateWrapper = () => {
  const { setPCRData } = useContext(PCRDataContext)
  const { pcrMetaproject } = useContext(PCRDataContext)
  const { data, loading } = pcrMetaproject

  const agencyIds = useMemo(
    () => uniq(map(data?.projects, 'agency_id')),
    [data],
  )
  const initialProjectComponentData = map(agencyIds, (agency_id) => ({
    agency_id,
    pcr_project_component: [],
  }))
  const initialGenderMainstreamingData = map(agencyIds, (agency_id) => ({
    agency_id,
    project_phase: [],
  }))
  const initialSDGsData = map(agencyIds, (agency_id) => ({
    agency_id,
    sdgs: [],
  }))

  useEffect(() => {
    setPCRData((prevData) => ({
      ...prevData,
      causes_of_delay: initialProjectComponentData,
      lessons_learned: initialProjectComponentData,
      gender_mainstreaming: initialGenderMainstreamingData,
      sdg_contribution: initialSDGsData,
    }))
  }, [agencyIds])

  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

  useEffect(() => {
    clearUpdatedFields()
  }, [])

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
