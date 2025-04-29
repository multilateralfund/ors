'use client'

import { useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import Link from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ProjectEdit from './ProjectEdit'

import { useGetProject } from '../hooks/useGetProject'
import { useGetProjectFiles } from '../hooks/useGetProjectFiles'
import { api, uploadFiles } from '@ors/helpers'

import { Button } from '@mui/material'
import { useParams } from 'wouter'
import { enqueueSnackbar } from 'notistack'

const ProjectsEditWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()

  const project = useGetProject(project_id)
  const { data, loading } = project
  const { data: projectFiles } = useGetProjectFiles(project_id) as any

  const [files, setFiles] = useState({
    deletedFilesIds: [],
    newFiles: [],
  })
  const { deletedFilesIds = [], newFiles = [] } = files || {}

  const [isSaving, setIsSaving] = useState(false)

  const editProject = async () => {
    setIsSaving(true)

    try {
      if (newFiles.length > 0) {
        await uploadFiles(
          `/api/project/${project_id}/files/v2/`,
          newFiles,
          false,
          'list',
        )
      }

      if (deletedFilesIds.length > 0) {
        await api(`/api/project/${project_id}/files/v2`, {
          data: {
            file_ids: deletedFilesIds,
          },
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'DELETE',
        })
      }

      setIsSaving(false)
      enqueueSnackbar(<>Updated {data.code}.</>, {
        variant: 'success',
      })
    } catch (error) {
      setIsSaving(false)

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
    }
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && (
        <>
          <HeaderTitle>
            <div className="align-center flex justify-between">
              <PageHeading className="min-w-fit">Edit {data.code}</PageHeading>
              <div>
                <div className="container flex w-full justify-between gap-x-4 px-0">
                  <Link
                    className="border border-solid border-primary bg-white px-4 py-2 text-primary shadow-none hover:bg-primary hover:text-white"
                    color="primary"
                    href={`/projects-listing/${project_id}`}
                    size="large"
                    variant="contained"
                    button
                  >
                    Cancel
                  </Link>
                  <Button
                    className="px-4 py-2 shadow-none hover:text-white"
                    size="large"
                    variant="contained"
                    onClick={editProject}
                  >
                    Save
                  </Button>
                  <Loading
                    className="!fixed bg-action-disabledBackground"
                    active={isSaving}
                  />
                </div>
              </div>
            </div>
          </HeaderTitle>
          <ProjectEdit {...{ project, files, setFiles, projectFiles }} />
        </>
      )}
    </>
  )
}

export default ProjectsEditWrapper
