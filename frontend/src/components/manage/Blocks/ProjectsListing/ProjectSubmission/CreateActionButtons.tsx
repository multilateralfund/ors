import Link from '@ors/components/ui/Link/Link'
import { formatSubmitData } from '../utils'
import { SubmitActionButtons } from '../interfaces'
import { api, uploadFiles } from '@ors/helpers'
import { useStore } from '@ors/store'

import { enqueueSnackbar } from 'notistack'
import { Button } from '@mui/material'
import { useParams } from 'wouter'
import cx from 'classnames'

const CreateActionButtons = ({
  projectData,
  files,
  projectId,
  setProjectId,
  isSubmitDisabled,
  setIsLoading,
  setErrors,
  setHasSubmitted,
  setFileErrors,
  specificFields,
  mode,
}: SubmitActionButtons & { projectId: number | null; mode: string }) => {
  const { project_id } = useParams<Record<string, string>>()

  const projectSlice = useStore((state) => state.projects)
  const user_permissions = projectSlice.user_permissions.data || []

  const { newFiles = [] } = files || {}

  const isAddComponentDisabled = isSubmitDisabled || !projectId

  const submitProject = async () => {
    setIsLoading(true)
    setFileErrors('')
    setErrors({})

    try {
      const data = formatSubmitData(projectData, specificFields)

      if (newFiles.length > 0) {
        await uploadFiles(
          `/api/project/files/validate/`,
          newFiles,
          false,
          'list',
        )
      }
      const result = await api(`api/projects/v2/`, {
        data:
          mode === 'link'
            ? { ...data, associate_project_id: parseInt(project_id) }
            : data,
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
        }
      }
      setProjectId(null)
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
        <>
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
            Save
          </Button>
          <Link
            className={cx('ml-auto mr-0 h-10 px-3 py-1', {
              'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow':
                !isAddComponentDisabled,
            })}
            href={`/projects-listing/create/${projectId}/additional-component`}
            size="large"
            variant="contained"
            button
            disabled={isAddComponentDisabled}
          >
            Add additional component
          </Link>
        </>
      )}
    </div>
  )
}

export default CreateActionButtons
