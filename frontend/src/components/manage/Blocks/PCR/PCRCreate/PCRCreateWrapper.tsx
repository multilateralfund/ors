import { useContext, useEffect, useMemo } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import PCRHeader from '../PCRSubmission/PCRHeader'
import PCRForm from '../PCRSubmission/PCRForm'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'

import { map, uniqBy } from 'lodash'

const PCRCreateWrapper = () => {
  const { pcrMetaproject, setPCRData, setFiles, setFilesMetadata } =
    useContext(PCRDataContext)
  const { data, loading } = pcrMetaproject

  const agencyData = useMemo(
    () =>
      uniqBy(
        map(data?.projects, ({ agency_id, agency }) => ({ agency_id, agency })),
        'agency_id',
      ),
    [data],
  )
  const initialResultsAssessment = useMemo(
    () => map(agencyData, (data) => ({ ...data, activities: [] })),
    [agencyData],
  )
  const initialProjectComponentData = useMemo(
    () => map(agencyData, (data) => ({ ...data, pcr_project_component: [] })),
    [agencyData],
  )
  const initialGenderMainstreamingData = useMemo(
    () => map(agencyData, (data) => ({ ...data, project_phases: [] })),
    [agencyData],
  )
  const initialSdgsData = useMemo(
    () => map(agencyData, (data) => ({ ...data, sdgs: [] })),
    [agencyData],
  )
  const initialFiles = useMemo(
    () =>
      map(agencyData, (data) => ({
        ...data,
        newFiles: [],
        deletedFilesIds: [],
      })),
    [agencyData],
  )
  const initialFilesMetadata = useMemo(
    () => map(agencyData, (data) => ({ ...data, filesMetadata: [] })),
    [agencyData],
  )

  useEffect(() => {
    setPCRData((prevData) => ({
      ...prevData,
      results_assessment: initialResultsAssessment,
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

  useEffect(() => {
    setFiles(initialFiles)
  }, [initialFiles, setFiles])

  useEffect(() => {
    setFilesMetadata(initialFilesMetadata)
  }, [initialFilesMetadata, setFilesMetadata])

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
