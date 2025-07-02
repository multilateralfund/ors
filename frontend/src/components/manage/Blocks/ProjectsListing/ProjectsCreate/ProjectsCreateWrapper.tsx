'use client'

import { useEffect, useState } from 'react'

import ProjectsHeader from '../ProjectSubmission/ProjectsHeader.tsx'
import ProjectsCreate from './ProjectsCreate.tsx'
import ProjectSubmissionFooter from '../ProjectSubmission/ProjectSubmissionFooter.tsx'
import { fetchSpecificFields } from '../hooks/getSpecificFields.ts'
import {
  ProjectData,
  ProjectFilesObject,
  ProjectSpecificFields,
  ProjectTypeApi,
  TrancheErrorType,
} from '../interfaces.ts'
import {
  initialCrossCuttingFields,
  initialProjectIdentifiers,
} from '../constants.ts'
import { getDefaultValues, getNonFieldErrors } from '../utils.ts'
import { useStore } from '@ors/store.tsx'

import { groupBy } from 'lodash'

const ProjectsCreateWrapper = () => {
  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data

  const [specificFields, setSpecificFields] = useState<ProjectSpecificFields[]>(
    [],
  )

  const groupedFields = groupBy(specificFields, 'table')
  const projectFields = groupedFields['project'] || []

  const initialProjectSpecificFields = {
    ...getDefaultValues<ProjectTypeApi>(projectFields),
    ods_odp: [],
  }

  const [projectData, setProjectData] = useState<ProjectData>({
    projIdentifiers: {
      ...initialProjectIdentifiers,
      current_agency: agency_id ?? null,
    },
    bpLinking: { isLinkedToBP: false, bpId: null },
    crossCuttingFields: initialCrossCuttingFields,
    projectSpecificFields: initialProjectSpecificFields,
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
  const [trancheErrors, setTrancheErrors] = useState<TrancheErrorType>({
    errorText: '',
    isError: false,
  })

  const nonFieldsErrors = getNonFieldErrors(errors)

  useEffect(() => {
    if (cluster && project_type && sector) {
      fetchSpecificFields(cluster, project_type, sector, setSpecificFields)
    } else setSpecificFields([])
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
          trancheErrors,
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
          trancheErrors,
          setTrancheErrors,
        }}
      />
      <ProjectSubmissionFooter
        successMessage="Submission was successful."
        {...{ projectId, nonFieldsErrors, fileErrors, otherErrors }}
      />
    </>
  )
}

export default ProjectsCreateWrapper
