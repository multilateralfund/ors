'use client'

import { useEffect, useMemo, useState } from 'react'

import ProjectsHeader from '../ProjectSubmission/ProjectsHeader.tsx'
import ProjectsCreate from './ProjectsCreate.tsx'
import ProjectFormFooter from '../ProjectSubmission/ProjectFormFooter.tsx'
import { fetchSpecificFields } from '../hooks/getSpecificFields.ts'
import {
  ProjectData,
  ProjectFilesObject,
  ProjectSpecificFields,
  ProjectTypeApi,
  SpecificFields,
} from '../interfaces.ts'
import {
  initialCrossCuttingFields,
  initialProjectIdentifiers,
} from '../constants.ts'
import { getDefaultValues, getNonFieldErrors } from '../utils.ts'
import { useStore } from '@ors/store.tsx'

import { debounce, groupBy } from 'lodash'

const ProjectsCreateWrapper = () => {
  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data

  const {
    fetchProjectFields,
    projectFields: allFields,
    setViewableFields,
    setEditableFields,
  } = useStore((state) => state.projectFields)

  const debouncedFetchProjectFields = useMemo(
    () => debounce(() => fetchProjectFields?.(), 0),
    [fetchProjectFields],
  )

  useEffect(() => {
    debouncedFetchProjectFields()
  }, [])

  useEffect(() => {
    if (allFields && allFields.loaded && allFields.data) {
      setViewableFields?.(1)
      setEditableFields?.(1)
    }
  }, [allFields, setViewableFields, setEditableFields])

  const [specificFields, setSpecificFields] = useState<ProjectSpecificFields[]>(
    [],
  )
  const [specificFieldsLoaded, setSpecificFieldsLoaded] =
    useState<boolean>(false)

  const groupedFields = groupBy(specificFields, 'table')
  const projectFields = groupedFields['project'] || []

  const initialProjectSpecificFields = {
    ...getDefaultValues<ProjectTypeApi>(projectFields),
    ods_odp: [],
  }

  const [projectData, setProjectData] = useState<ProjectData>({
    projIdentifiers: {
      ...initialProjectIdentifiers,
      agency: agency_id ?? null,
      lead_agency: agency_id ?? null,
    },
    bpLinking: { isLinkedToBP: false, bpId: null },
    crossCuttingFields: initialCrossCuttingFields,
    projectSpecificFields: initialProjectSpecificFields,
    approvalFields: {} as SpecificFields,
  })

  const { projIdentifiers, crossCuttingFields } = projectData
  const { cluster } = projIdentifiers
  const { project_type, sector } = crossCuttingFields

  const [projectId, setProjectId] = useState<number | null>(null)
  const [files, setFiles] = useState<ProjectFilesObject>({
    deletedFilesIds: [],
    newFiles: [],
  })
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)

  const [errors, setErrors] = useState<{ [key: string]: [] }>({})
  const [fileErrors, setFileErrors] = useState<string>('')
  const [otherErrors, setOtherErrors] = useState<string>('')

  const nonFieldsErrors = getNonFieldErrors(errors)

  useEffect(() => {
    setSpecificFieldsLoaded(false)

    if (cluster && project_type && sector) {
      fetchSpecificFields(
        cluster,
        project_type,
        sector,
        setSpecificFields,
        null,
        setSpecificFieldsLoaded,
      )
    } else {
      setSpecificFields([])
      setSpecificFieldsLoaded(true)
    }
  }, [cluster, project_type, sector])

  return (
    <>
      <ProjectsHeader
        mode="add"
        {...{
          projectData,
          files,
          setProjectId,
          setErrors,
          setHasSubmitted,
          setFileErrors,
          setOtherErrors,
          specificFields,
          specificFieldsLoaded,
        }}
      />
      <ProjectsCreate
        mode="add"
        {...{
          projectData,
          setProjectData,
          specificFields,
          files,
          setFiles,
          errors,
          setErrors,
          hasSubmitted,
          fileErrors,
          specificFieldsLoaded,
        }}
      />
      <ProjectFormFooter
        successMessage="Submission was successful."
        {...{ projectId, nonFieldsErrors, fileErrors, otherErrors }}
      />
    </>
  )
}

export default ProjectsCreateWrapper
