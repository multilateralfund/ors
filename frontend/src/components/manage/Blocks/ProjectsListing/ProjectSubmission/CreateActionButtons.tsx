import { Dispatch, SetStateAction } from 'react'

import Link from '@ors/components/ui/Link/Link'
import { formatSubmitData } from '../utils'
import { ProjectData, ProjectFilesObject } from '../interfaces'
import { api, uploadFiles } from '@ors/helpers'
import { useStore } from '@ors/store'

import { enqueueSnackbar } from 'notistack'
import { Button } from '@mui/material'
import cx from 'classnames'

const CreateActionButtons = ({
  projectData,
  files,
  setProjectId,
  isSubmitDisabled,
  setIsLoading,
  setErrors = () => {},
}: {
  projectData: ProjectData
  files: ProjectFilesObject
  setProjectId: Dispatch<SetStateAction<number | null | undefined>>
  isSubmitDisabled: boolean
  setIsLoading: Dispatch<SetStateAction<boolean>>
  setErrors?: Dispatch<SetStateAction<{ [key: string]: [] }>>
}) => {
  const projectSlice = useStore((state) => state.projects)
  const user_permissions = projectSlice.user_permissions.data || []

  const disableButton = isSubmitDisabled || files?.newFiles?.length === 0

  const { newFiles = [] } = files || {}

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

      setProjectId(result.id)
      setErrors({})
    } catch (error) {
      if (error.status === 400) {
        const errors = await error.json()
        if (errors?.files) {
          enqueueSnackbar(errors.files, {
            variant: 'error',
          })
        } else {
          setErrors(errors)
          enqueueSnackbar(<>An error occurred. Please try again.</>, {
            variant: 'error',
          })
        }
      }

      setProjectId(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Link
        className="border border-solid border-primary bg-white px-4 py-2 text-primary shadow-none hover:bg-primary hover:text-white"
        color="primary"
        href="/projects-listing"
        size="large"
        variant="contained"
        button
      >
        Cancel
      </Link>
      {user_permissions.includes('add_project') && (
        <Button
          className={cx('ml-auto mr-0 h-10 px-3 py-1', {
            'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow':
              !disableButton,
          })}
          size="large"
          variant="contained"
          onClick={submitProject}
          disabled={disableButton}
        >
          Submit
        </Button>
      )}
    </div>
  )
}

export default CreateActionButtons
