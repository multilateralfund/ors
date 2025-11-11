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
import { fromPairs, map } from 'lodash'

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
  filesMetaData,
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

      const formattedFilesMetadata = fromPairs(
        map(filesMetaData, (file) => [file.name, file.type]),
      )
      const params = { metadata: JSON.stringify(formattedFilesMetadata) }

      if (newFiles.length > 0) {
        await uploadFiles(
          `/api/project/files/validate/`,
          newFiles,
          false,
          'list',
          params,
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
          `/api/projects/v2/${result.id}/project-files/`,
          newFiles,
          false,
          'list',
          params,
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

        if (errors?.metadata) {
          setFileErrors(errors.metadata)
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
