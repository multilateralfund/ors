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
  const initialGenderMainstreamingData = useMemo(
    () =>
      map(agencyIds, (agency_id) => ({
        agency_id,
        project_phases: [],
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
    initialProjectComponentData,
    initialGenderMainstreamingData,
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
