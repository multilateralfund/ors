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
} from '../interfaces.ts'
import {
  initialCrossCuttingFields,
  initialProjectIdentifiers,
} from '../constants.ts'
import { getDefaultValues, getNonFieldErrors } from '../utils.ts'

import { groupBy } from 'lodash'

const ProjectsCreateWrapper = () => {
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
    projIdentifiers: initialProjectIdentifiers,
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

  const hasNoFiles = files?.newFiles?.length === 0
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
          hasNoFiles,
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
          hasNoFiles,
          fileErrors,
        }}
      />
      <ProjectSubmissionFooter
        successMessage="Submission was successful."
        {...{ projectId, nonFieldsErrors, fileErrors }}
      />
    </>
  )
}

export default ProjectsCreateWrapper
