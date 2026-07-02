import { useContext, useMemo, useState } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import { enabledButtonClassname, projectPhaseOutFields } from '../constants'
import {
  checkInvalidValue,
  formatFiles,
  formatProjectFields,
  formatSubmitData,
  getCrossCuttingErrors,
  getDefaultImpactErrors,
  getHasNoFiles,
  getNonFieldErrors,
  getSpecificFieldsErrors,
  hasSectionErrors,
  isOtherOdsReplacement,
} from '../utils'
import {
  ProjectFile,
  ProjectTypeApi,
  ActionButtons,
  FileMetaDataType,
} from '../interfaces'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { api, uploadFiles } from '@ors/helpers'
import { useStore } from '@ors/store'

import { filter, find, fromPairs, lowerCase, map, pick } from 'lodash'
import { Button } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useLocation } from 'wouter'
import cx from 'classnames'
import CancelWarningModal from '../../ProjectsListing/ProjectSubmission/CancelWarningModal'

const EditActionButtons = ({
  projectData,
  setProjectData,
  project,
  files,
  projectFiles,
  isSaveDisabled,
  isSubmitDisabled,
  setIsLoading,
  setFileErrors,
  setErrors,
  setProjectFiles,
  specificFields,
  specificFieldsLoaded,
  filesMetaData,
}: ActionButtons & {
  project: ProjectTypeApi
  isSubmitDisabled: boolean
  projectFiles?: ProjectFile[]
  setProjectFiles: (value: ProjectFile[]) => void
}) => {
  const [_, setLocation] = useLocation()
  const { setInlineMessage } = useStore((state) => state.inlineMessage)

  const { canUpdateProjects, canUpdateV3Projects, canEditApprovedProjects } =
    useContext(PermissionsContext)
  const { altTechs } = useContext(ProjectsDataContext)

  const { projectFields } = useStore((state) => state.projectFields)
  const { updatedFields, clearUpdatedFields } = useUpdatedFields()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

  const { id, submission_status, version, component, editable } = project
  const { crossCuttingFields, projectSpecificFields } = projectData

  const canEditProject =
    (version < 3 && canUpdateProjects) || (version >= 3 && canUpdateV3Projects)

  const specificFieldsAvailable = map(specificFields, 'write_field_name')
  const odsOdpData =
    map(projectSpecificFields?.ods_odp, (field) =>
      pick(field, specificFieldsAvailable),
    ) ?? []

  const submissionStatus = lowerCase(submission_status)
  const isWithdrawn = submissionStatus === 'withdrawn'
  const isApproved = submissionStatus === 'approved'

  const crossCuttingErrors = useMemo(
    () =>
      getCrossCuttingErrors(
        crossCuttingFields,
        {},
        'edit',
        project,
        false,
        false,
        !isApproved,
      ),
    [crossCuttingFields],
  )

  const specificErrors = useMemo(
    () =>
      getSpecificFieldsErrors(
        projectSpecificFields,
        specificFields,
        {},
        'edit',
        canEditApprovedProjects,
        !isApproved,
        project,
      ),
    [projectSpecificFields, project, specificFields],
  )

  const hasOdsOdpFields = find(
    specificFields,
    (field) => field.table === 'ods_odp',
  )

  const hasOdsOdpErrors =
    hasOdsOdpFields &&
    (odsOdpData.some((data, index) =>
      Object.entries(data)
        .filter(([key]) => !projectPhaseOutFields.includes(key))
        .some(([field, value]) => {
          const odsReplacementValue =
            projectSpecificFields?.ods_odp?.[index]?.['ods_replacement']

          const formattedVal =
            field !== 'ods_replacement_text' ||
            isOtherOdsReplacement(altTechs, odsReplacementValue)
              ? value
              : odsReplacementValue

          return checkInvalidValue(formattedVal)
        }),
    ) ||
      odsOdpData.length === 0)

  const {
    Header: headerErrors = {},
    'Substance Details': substanceErrors = {},
    Impact: impactErrors = {},
  } = specificErrors

  const tabErrors =
    hasSectionErrors(crossCuttingErrors) ||
    hasSectionErrors(headerErrors) ||
    hasSectionErrors(substanceErrors)

  const commonErrors =
    tabErrors ||
    hasOdsOdpErrors ||
    (getHasNoFiles(id, files, projectFiles) &&
      (submission_status !== 'Draft' || version === 1) &&
      (version ?? 0) < 3 &&
      !isWithdrawn &&
      (!component || id === component.original_project_id))

  const hasErrors =
    commonErrors || (!isApproved && hasSectionErrors(impactErrors))

  const defaultImpactErrors = getDefaultImpactErrors(
    projectSpecificFields,
    specificFields,
  )
  const hasImpactErrors = Object.values(defaultImpactErrors).some(
    (errors) => errors.length > 0,
  )

  const disableSubmit = !specificFieldsLoaded || isSubmitDisabled || hasErrors

  const disableUpdateForV3AndWithdrawn = !editable
    ? hasImpactErrors
    : isApproved
      ? tabErrors || isSaveDisabled
      : disableSubmit

  const disableUpdate =
    !specificFieldsLoaded ||
    (project.version >= 3 || isWithdrawn
      ? disableUpdateForV3AndWithdrawn
      : isSaveDisabled)

  const { deletedFilesIds = [], newFiles = [] } = files || {}

  const handleErrors = async (error: any, type?: string) => {
    let errors: any = {}

    if (error instanceof Response) {
      const contentType = error.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        errors = await error.json()
      } else {
        if (error.status === 413) {
          setFileErrors(
            'Uploaded files are too large. Maximum file size allowed is 170MB.',
          )
        }
        enqueueSnackbar(<>An error occurred. Please try again.</>, {
          variant: 'error',
        })

        return
      }

      if (error.status === 400) {
        setErrors(errors)

        const nonFieldErrors = getNonFieldErrors(errors)
        if (nonFieldErrors.length > 0) {
          setInlineMessage({
            type: 'error',
            errorMessages: nonFieldErrors,
          })
        }

        if (errors?.files ?? errors?.file ?? errors?.metadata) {
          setFileErrors(
            [errors?.files, errors?.file, errors?.metadata]
              .filter(Boolean)
              .join('\n'),
          )
        }

        if (errors?.details) {
          setInlineMessage({
            type: 'error',
            message: errors.details,
          })
        }

        if (type === 'files' && errors?.error) {
          setFileErrors(errors.error)
        }
      }
    }

    enqueueSnackbar(<>An error occurred. Please try again.</>, {
      variant: 'error',
    })
  }

  const editProject = async (navigationPage?: string) => {
    setIsLoading(true)
    setFileErrors('')
    setErrors({})
    setInlineMessage(null)

    const formattedProjectFields = formatProjectFields(projectFields)

    const existingFilesMetadata = filter(
      filesMetaData,
      (metadata) => metadata.id,
    )

    const filesForUpdate = filter(
      existingFilesMetadata,
      (metadata: FileMetaDataType) => {
        const crtFile = find(projectFiles, { id: metadata.id }) as ProjectFile
        return crtFile && crtFile.type !== metadata.type
      },
    )

    const newFilesMetadata = filter(filesMetaData, (metadata) => !metadata.id)
    const formattedFilesMetadata = fromPairs(
      map(newFilesMetadata, (file) => [file.name, file.type]),
    )
    const params = { metadata: JSON.stringify(formattedFilesMetadata) }

    try {
      // Validate files
      if (newFiles.length > 0) {
        await uploadFiles(
          `/api/project/files/validate/`,
          newFiles,
          false,
          'list',
          params,
        )
      }

      // Update project data, this may create a new version
      // so it's important to run before uploading any files
      // or other modifications.
      // The Project ID is preserved.
      const data = formatSubmitData(
        projectData,
        setProjectData,
        specificFields,
        formattedProjectFields,
        altTechs,
      )

      const result = await api(`api/projects/v2/${id}`, {
        data: data,
        method: 'PUT',
      })

      // Upload files
      if (newFiles.length > 0) {
        await uploadFiles(
          `/api/projects/v2/${id}/project-files/`,
          newFiles,
          false,
          'list',
          params,
        )
      }

      // Delete files
      if (deletedFilesIds.length > 0) {
        try {
          await api(`/api/projects/v2/${id}/project-files/delete`, {
            data: {
              file_ids: deletedFilesIds,
            },
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'DELETE',
          })
        } catch (error) {
          await handleErrors(error, 'files')
          throw error
        }
      }

      await Promise.all(
        map(filesForUpdate, async (file: FileMetaDataType) => {
          try {
            await api(
              `/api/projects/v2/${id}/project-files/${file.id}/edit_type`,
              {
                data: {
                  file_type: file.type,
                },
                method: 'PUT',
              },
            )
          } catch (error) {
            await handleErrors(error, 'files')
            throw error
          }
        }),
      )

      try {
        const res = await api(
          `/api/projects/v2/${id}/project-files/include_previous_versions`,
          {
            withStoreCache: false,
          },
          false,
        )
        setProjectFiles(formatFiles(res, id))
      } catch (error) {
        enqueueSnackbar(<>Could not fetch updated files.</>, {
          variant: 'error',
        })
        return
      }

      if (navigationPage) {
        setLocation(`/projects-listing/${id}/${navigationPage}`)
      }

      setInlineMessage({
        type: 'success',
        message: 'Updated project successfully.',
        redirectMessage: 'View project.',
        hrefRedirect: `/projects-listing/${result.id}`,
      })

      clearUpdatedFields()

      return true
    } catch (error) {
      await handleErrors(error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const onEditProject = async () => {
    const updatedSuccessfully = await editProject()

    if (updatedSuccessfully) {
      enqueueSnackbar(<>Updated project successfully.</>, {
        variant: 'success',
      })
    }
  }

  const onCancel = () => {
    if (updatedFields.size > 0) {
      setIsCancelModalOpen(true)
    } else {
      setLocation('/projects-listing/listing')
    }
  }

  return (
    <div className="container flex w-full flex-wrap justify-end gap-x-3 gap-y-2 px-0">
      <CancelLinkButton title="Cancel" href={null} onClick={onCancel} />
      {canEditProject && (
        <Button
          className={cx('px-4 py-2 shadow-none', {
            [enabledButtonClassname]: !disableUpdate,
          })}
          size="large"
          variant="contained"
          onClick={onEditProject}
          disabled={disableUpdate}
        >
          Update project
        </Button>
      )}
      {isCancelModalOpen && setIsCancelModalOpen && (
        <CancelWarningModal
          mode="project editing"
          isModalOpen={isCancelModalOpen}
          setIsModalOpen={setIsCancelModalOpen}
        />
      )}
    </div>
  )
}

export default EditActionButtons
