'use client'

import { useEffect, useState } from 'react'

import Link from '@ors/components/ui/Link/Link'
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
import {
  formatSubmitData,
  getDefaultValues,
  getIsSubmitDisabled,
} from '../utils.ts'
import { api, uploadFiles } from '@ors/helpers'
import { useStore } from '@ors/store.tsx'

import { Alert, Button, CircularProgress } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { groupBy, isNil } from 'lodash'
import cx from 'classnames'

const ProjectsCreateWrapper = () => {
  const projectSlice = useStore((state) => state.projects)
  const user_permissions = projectSlice.user_permissions.data || []

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

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState<boolean>()
  const [projectId, setProjectId] = useState<number | null>(null)

  const { projIdentifiers, crossCuttingFields } = projectData
  const { cluster } = projIdentifiers
  const { project_type, sector } = crossCuttingFields

  const [files, setFiles] = useState<ProjectFilesObject>({
    deletedFilesIds: [],
    newFiles: [],
  })
  const { newFiles = [] } = files

  useEffect(() => {
    if (cluster && project_type && sector) {
      fetchSpecificFields(cluster, project_type, sector, setSpecificFields)
    } else setSpecificFields([])
  }, [cluster, project_type, sector])

  const isSubmitDisabled = getIsSubmitDisabled(
    projIdentifiers,
    crossCuttingFields,
  )

  const submitProject = async () => {
    setIsLoading(true)

    try {
      const data = formatSubmitData(projectData)

      const result = await api(`api/projects/v2/`, {
        data: data,
        method: 'POST',
      })

      if (newFiles.length > 0) {
        await uploadFiles(
          `/api/project/${result.id}/files/v2/`,
          newFiles,
          false,
          'list',
        )
      }

      setIsSubmitSuccessful(true)
      setProjectId(result.id)
    } catch (error) {
      if (error.status === 400) {
        const errors = await error.json()
        if (errors?.files) {
          enqueueSnackbar(errors.files, {
            variant: 'error',
          })
        } else {
          enqueueSnackbar(<>An error occurred. Please try again.</>, {
            variant: 'error',
          })
        }
      }

      setIsSubmitSuccessful(false)
      setProjectId(null)
    } finally {
      setIsLoading(false)
    }
  }

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2.5">
      {user_permissions.includes('add_project') && (
        <Button
          className={cx('ml-auto mr-0 h-10 px-3 py-1', {
            'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow':
              !isSubmitDisabled,
          })}
          size="large"
          variant="contained"
          onClick={submitProject}
          disabled={isSubmitDisabled}
        >
          Submit
        </Button>
      )}
      {isLoading && (
        <CircularProgress color="inherit" size="30px" className="ml-1.5" />
      )}
    </div>
  )

  return (
    <>
      <ProjectsCreate
        heading="New project submission"
        mode="add"
        {...{
          projectData,
          setProjectData,
          actionButtons,
          specificFields,
          files,
          setFiles,
        }}
      />

      {!isNil(isSubmitSuccessful) && (
        <Alert
          className="BPAlert mt-4 w-fit border-0"
          severity={isSubmitSuccessful ? 'success' : 'error'}
        >
          {isSubmitSuccessful && projectId ? (
            <Link
              className="text-xl text-inherit no-underline"
              href={`/projects-listing/${projectId}`}
            >
              <p className="m-0 text-lg">
                Submission was successful. View project.
              </p>
            </Link>
          ) : (
            <p className="m-0 text-lg">An error occurred. Please try again</p>
          )}
        </Alert>
      )}
    </>
  )
}

export default ProjectsCreateWrapper
