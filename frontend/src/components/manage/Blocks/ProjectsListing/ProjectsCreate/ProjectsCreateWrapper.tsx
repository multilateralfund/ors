'use client'

import { useEffect, useState } from 'react'

import Link from '@ors/components/ui/Link/Link'
import ProjectsHeader from '../ProjectSubmission/ProjectsHeader.tsx'
import ProjectsCreate from './ProjectsCreate.tsx'
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

import { Alert } from '@mui/material'
import { groupBy, map } from 'lodash'

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
        {...{ projectData, files, setProjectId, setErrors, setHasSubmitted }}
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
        }}
      />

      {(projectId || nonFieldsErrors.length > 0) && (
        <Alert
          className="BPAlert mt-4 w-fit border-0"
          severity={projectId ? 'success' : 'error'}
        >
          {projectId ? (
            <Link
              className="text-xl text-inherit no-underline"
              href={`/projects-listing/${projectId}`}
            >
              <p className="m-0 mt-0.5 text-lg">
                Submission was successful. View project.
              </p>
            </Link>
          ) : (
            nonFieldsErrors.length > 0 && (
              <div className="m-0 mt-1.5">
                {map(nonFieldsErrors, (err) => (
                  <div>{err}</div>
                ))}
              </div>
            )
          )}
        </Alert>
      )}
    </>
  )
}

export default ProjectsCreateWrapper
