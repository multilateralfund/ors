import { useContext } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { SubmitButton } from '../HelperComponents'
import { formatProjectFields, formatSubmitData } from '../utils'
import { ActionButtons } from '../interfaces'
import { api, uploadFiles } from '@ors/helpers'
import { useStore } from '@ors/store'

import { useLocation, useParams } from 'wouter'
import { enqueueSnackbar } from 'notistack'

const CreateActionButtons = ({
  projectData,
  setProjectData,
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
}: ActionButtons & { mode: string }) => {
  const [_, setLocation] = useLocation()
  const { project_id } = useParams<Record<string, string>>()

  const { canUpdateProjects } = useContext(PermissionsContext)
  const { setWarnings } = useStore((state) => state.projectWarnings)
  const { projectFields } = useStore((state) => state.projectFields)

  const { newFiles = [] } = files || {}

  const createProject = async () => {
    setIsLoading(true)
    setFileErrors('')
    setOtherErrors('')
    setErrors({})

    try {
      const data = formatSubmitData(
        projectData,
        setProjectData,
        specificFields,
        formatProjectFields(projectFields),
      )

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
          className="!py-2"
        />
      )}
    </div>
  )
}

export default CreateActionButtons
