import { Dispatch, SetStateAction } from 'react'

import Link from '@ors/components/ui/Link/Link'
import { formatSubmitData } from '../utils'
import { ProjectFile, ProjectTypeApi, SubmitActionButtons } from '../interfaces'
import { api, uploadFiles } from '@ors/helpers'
import { useStore } from '@ors/store'

import { enqueueSnackbar } from 'notistack'
import { Button } from '@mui/material'
import cx from 'classnames'

const EditActionButtons = ({
  projectData,
  project,
  files,
  setProjectId,
  isSubmitDisabled,
  setIsLoading,
  setHasSubmitted,
  setFileErrors,
  setOtherErrors,
  setErrors,
  setProjectFiles,
  specificFields,
}: SubmitActionButtons & {
  project: ProjectTypeApi
  setProjectFiles: (value: ProjectFile[]) => void
}) => {
  const { id } = project

  const projectSlice = useStore((state) => state.projects)
  const user_permissions = projectSlice.user_permissions.data || []

  const { deletedFilesIds = [], newFiles = [] } = files || {}

  const handleErrors = async (error: any) => {
    const errors = await error.json()

    if (error.status === 400) {
      if (errors?.files) {
        setFileErrors(errors.files)
      } else {
        setErrors(errors)
      }
    } else if (errors?.details) {
      setOtherErrors(errors.details)
    }

    setProjectId(null)
    enqueueSnackbar(<>An error occurred. Please try again.</>, {
      variant: 'error',
    })
  }

  const editProject = async () => {
    setIsLoading(true)
    setFileErrors('')
    setOtherErrors('')
    setErrors({})

    try {
      if (newFiles.length > 0) {
        await uploadFiles(
          `/api/project/${id}/files/v2/`,
          newFiles,
          false,
          'list',
        )
      }

      if (deletedFilesIds.length > 0) {
        await api(`/api/project/${id}/files/v2`, {
          data: {
            file_ids: deletedFilesIds,
          },
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'DELETE',
        })
      }

      const res = await api(
        `/api/project/${id}/files/v2/`,
        {
          withStoreCache: false,
        },
        false,
      )
      setProjectFiles(res)

      const data = formatSubmitData(projectData, specificFields)

      const result = await api(`api/projects/v2/${id}`, {
        data: data,
        method: 'PUT',
      })
      setProjectId(result.id)
    } catch (error) {
      await handleErrors(error)
    } finally {
      setIsLoading(false)
      setHasSubmitted(true)
    }
  }

  const submitProject = async () => {
    await editProject()
    try {
      await api(`api/projects/v2/${id}/submit`, {
        method: 'POST',
      })
    } catch (error) {
      await handleErrors(error)
    } finally {
      setIsLoading(false)
      setHasSubmitted(true)
    }
  }

  const increaseVersion = async () => {
    setIsLoading(true)

    try {
      const data = formatSubmitData(projectData, specificFields)

      await api(`api/projects/v2/${id}/increase_version/`, {
        data: data,
        method: 'POST',
      })
    } catch (error) {
      console.error('Could not increase version.')
    } finally {
      setIsLoading(false)
    }
  }

  const enabledButtonClassname =
    'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow'

  return (
    <div className="container flex w-full flex-wrap gap-x-3 gap-y-2 px-0">
      {user_permissions.includes('view_project') && (
        <Link
          className="border border-solid border-primary bg-white px-4 py-2 text-primary shadow-none hover:bg-primary hover:text-white"
          color="primary"
          href={`/projects-listing/${id}`}
          size="large"
          variant="contained"
          button
        >
          Cancel
        </Link>
      )}
      {user_permissions.includes('edit_project') && (
        <Button
          className={cx('px-4 py-2 shadow-none', {
            [enabledButtonClassname]: !isSubmitDisabled,
          })}
          size="large"
          variant="contained"
          onClick={editProject}
          disabled={isSubmitDisabled}
        >
          Update project
        </Button>
      )}
      {user_permissions.includes('increase_project_version') && (
        <>
          {/*<Button*/}
          {/*  className={cx('px-4 py-2 shadow-none', {*/}
          {/*    [enabledButtonClassname]: !isSubmitDisabled,*/}
          {/*  })}*/}
          {/*  size="large"*/}
          {/*  variant="contained"*/}
          {/*  onClick={increaseVersion}*/}
          {/*  disabled={isSubmitDisabled}*/}
          {/*>*/}
          {/*  Submit new version*/}
          {/*</Button>*/}
          <Link
            className={cx(
              'ml-auto mr-0 h-10 px-3 py-1',
              'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow',
            )}
            href={`/projects-listing/create/${id}/additional-component`}
            size="large"
            variant="contained"
            button
          >
            Add additional component
          </Link>
          <Button
            className={cx('px-4 py-2', {
              'bg-primary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow':
                !isSubmitDisabled,
            })}
            size="large"
            variant="contained"
            onClick={submitProject}
            disabled={isSubmitDisabled}
          >
            Submit project
          </Button>
        </>
      )}
    </div>
  )
}

export default EditActionButtons
