import { Dispatch, SetStateAction } from 'react'

import Link from '@ors/components/ui/Link/Link'
import { formatSubmitData } from '../utils'
import { SubmitActionButtons } from '../interfaces'
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
  setErrors,
  setHasSubmitted,
  setFileErrors,
}: SubmitActionButtons & {
  setProjectId: Dispatch<SetStateAction<number | null>>
}) => {
  const projectSlice = useStore((state) => state.projects)
  const user_permissions = projectSlice.user_permissions.data || []

  const disableButton = isSubmitDisabled || files?.newFiles?.length === 0

  const { newFiles = [] } = files || {}

  const submitProject = async () => {
    setIsLoading(true)
    setFileErrors('')
    setErrors({})

    try {
      const data = formatSubmitData(projectData)

      const result = await api(`api/projects/v2/`, {
        data: data,
        method: 'POST',
      })
      setProjectId(result.id)

      if (newFiles.length > 0) {
        await uploadFiles(
          `/api/project/${result.id}/files/v2/`,
          newFiles,
          false,
          'list',
        )
      }
    } catch (error) {
      if (error.status === 400) {
        const errors = await error.json()

        if (errors?.file) {
          setFileErrors(errors.file)
        } else {
          setErrors(errors)
          setProjectId(null)
        }
      }
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
      setHasSubmitted(true)
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
