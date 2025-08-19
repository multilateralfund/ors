import { useContext } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { SubmitButton } from '../HelperComponents'
import { formatSubmitData } from '../utils'
import { SubmitActionButtons } from '../interfaces'
import { api, uploadFiles } from '@ors/helpers'
import { useStore } from '@ors/store'

import { enqueueSnackbar } from 'notistack'
import { useLocation, useParams } from 'wouter'

const CreateActionButtons = ({
  projectData,
  files,
  setProjectId,
  isSaveDisabled,
  setIsLoading,
  setErrors,
  setHasSubmitted,
  setFileErrors,
  setOtherErrors,
  specificFields,
  specificFieldsLoaded,
  mode,
}: SubmitActionButtons & { mode: string }) => {
  const [_, setLocation] = useLocation()
  const { project_id } = useParams<Record<string, string>>()

  const { canUpdateProjects } = useContext(PermissionsContext)
  const { setWarnings } = useStore((state) => state.projectWarnings)

  const { newFiles = [] } = files || {}

  const createProject = async () => {
    setIsLoading(true)
    setFileErrors('')
    setOtherErrors('')
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
          mode === 'full-link' || mode === 'partial-link'
            ? { ...data, associate_project_id: parseInt(project_id) }
            : data,
        method: 'POST',
      })
      setProjectId(result.id)
      setWarnings({ id: result.id, warnings: result.warnings })

      if (newFiles.length > 0) {
        await uploadFiles(
          `/api/project/${result.id}/files/v2/`,
          newFiles,
          false,
          'list',
        )
      }
      setLocation(`/projects-listing/${result.id}/edit`)
    } catch (error) {
      const errors = await error.json()

      if (error.status === 400) {
        setErrors(errors)

        if (errors?.file) {
          setFileErrors(errors.file)
        }

        if (errors?.details) {
          setOtherErrors(errors.details)
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
      <CancelLinkButton title="Cancel" href="/projects-listing/listing" />
      {canUpdateProjects && (
        <SubmitButton
          title="Create project (draft)"
          isDisabled={!specificFieldsLoaded || isSaveDisabled}
          onSubmit={createProject}
          className="ml-auto"
        />
      )}
    </div>
  )
}

export default CreateActionButtons
