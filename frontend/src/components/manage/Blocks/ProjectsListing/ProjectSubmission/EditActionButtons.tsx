import { useContext, useMemo, useState } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import EditActionModals from './EditActionModals'
import {
  DropDownButtonProps,
  DropDownMenuProps,
  IncreaseVersionButton,
} from '../HelperComponents'
import {
  dropDownClassName,
  dropdownItemClassname,
  enabledButtonClassname,
} from '../constants'
import {
  canEditField,
  checkInvalidValue,
  formatApprovalData,
  formatFiles,
  formatProjectFields,
  formatSubmitData,
  getActualData,
  getApprovalErrors,
  getCrossCuttingErrors,
  getHasNoFiles,
  getSpecificFieldsErrors,
  hasSectionErrors,
} from '../utils'
import {
  ProjectFile,
  ProjectTypeApi,
  ActionButtons,
  RelatedProjectsType,
  TrancheErrorType,
  ProjectSpecificFields,
  BpDataProps,
  FileMetaDataType,
} from '../interfaces'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { api, uploadFiles } from '@ors/helpers'
import { useStore } from '@ors/store'

import { filter, find, fromPairs, lowerCase, map, pick } from 'lodash'
import { Button, Divider } from '@mui/material'
import { enqueueSnackbar } from 'notistack'
import { useLocation } from 'wouter'
import cx from 'classnames'
import dayjs from 'dayjs'

const EditActionButtons = ({
  projectData,
  setProjectData,
  project,
  files,
  projectFiles,
  setProjectId,
  setProjectTitle,
  isSaveDisabled,
  isSubmitDisabled,
  setIsLoading,
  setFileErrors,
  setOtherErrors,
  setErrors,
  setProjectFiles,
  specificFields,
  trancheErrors,
  approvalFields = [],
  specificFieldsLoaded,
  setParams,
  postExComUpdate,
  bpData,
  filesMetaData,
}: ActionButtons & {
  setProjectTitle: (title: string) => void
  project: ProjectTypeApi
  isSubmitDisabled: boolean
  projectFiles?: ProjectFile[]
  setProjectFiles: (value: ProjectFile[]) => void
  trancheErrors?: TrancheErrorType
  approvalFields?: ProjectSpecificFields[]
  setParams?: any
  postExComUpdate?: boolean
  bpData: BpDataProps
}) => {
  const [_, setLocation] = useLocation()

  const {
    canUpdateProjects,
    canUpdateV3Projects,
    canSubmitProjects,
    canRecommendProjects,
    canApproveProjects,
    canEditApprovedProjects,
    canViewBp,
  } = useContext(PermissionsContext)

  const showSubmitTranchesWarningModal = trancheErrors?.tranchesData?.find(
    (tranche: RelatedProjectsType) => tranche.warnings.length > 0,
  )

  const { projectFields, editableFields } = useStore(
    (state) => state.projectFields,
  )

  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false)
  const [isTrancheWarningOpen, setIsTrancheWarningOpen] = useState(false)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [isSendToDraftModalOpen, setIsSendToDraftModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false)

  const { id, submission_status, version, component } = project
  const {
    projIdentifiers,
    bpLinking,
    crossCuttingFields,
    projectSpecificFields,
    approvalFields: approvalData,
  } = projectData

  const canEditProject =
    postExComUpdate ||
    (version < 3 && canUpdateProjects) ||
    (version >= 3 && canUpdateV3Projects)

  const specificFieldsAvailable = map(specificFields, 'write_field_name')
  const odsOdpData =
    map(projectSpecificFields?.ods_odp, (field) =>
      pick(field, specificFieldsAvailable),
    ) ?? []

  const submissionStatus = lowerCase(submission_status)
  const isDraft = submissionStatus === 'draft'
  const isSubmitted = submissionStatus === 'submitted'
  const isWithdrawn = submissionStatus === 'withdrawn'
  const isRecommended = submissionStatus === 'recommended'
  const isApproved = submissionStatus === 'approved'
  const isAfterApproval = isApproved || submissionStatus === 'not approved'

  const crossCuttingErrors = useMemo(
    () => getCrossCuttingErrors(crossCuttingFields, {}, 'edit', project, false),
    [crossCuttingFields],
  )
  const approvalErrors = useMemo(
    () =>
      getApprovalErrors(
        approvalData,
        crossCuttingFields,
        approvalFields,
        {},
        project,
      ),
    [approvalData, crossCuttingFields, approvalFields],
  )

  const specificErrors = useMemo(
    () =>
      getSpecificFieldsErrors(
        projectSpecificFields,
        specificFields,
        {},
        'edit',
        canEditApprovedProjects,
        project,
      ),
    [projectSpecificFields, project, specificFields],
  )

  const specificErrorsApproval = useMemo(
    () =>
      getSpecificFieldsErrors(
        projectSpecificFields,
        specificFields.filter(({ is_actual }) => !is_actual),
        {},
        'edit',
        canEditApprovedProjects,
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
    (odsOdpData.some((data) => Object.values(data).some(checkInvalidValue)) ||
      odsOdpData.length === 0)

  const {
    Header: headerErrors = {},
    'Substance Details': substanceErrors = {},
    Impact: impactErrors = {},
  } = specificErrors

  const commonErrors =
    hasSectionErrors(crossCuttingErrors) ||
    hasSectionErrors(headerErrors) ||
    hasSectionErrors(substanceErrors) ||
    hasOdsOdpErrors ||
    (getHasNoFiles(id, files, projectFiles) &&
      (submission_status !== 'Draft' || version === 1) &&
      (version ?? 0) < 3 &&
      !isWithdrawn &&
      (!component || id === component.original_project_id))

  const hasErrors =
    commonErrors ||
    (isAfterApproval
      ? hasSectionErrors(specificErrorsApproval['Impact'] || {})
      : hasSectionErrors(impactErrors)) ||
    (isAfterApproval &&
      dayjs(approvalData.date_completion).isBefore(dayjs(), 'day'))

  const disableSubmit =
    !specificFieldsLoaded ||
    isSubmitDisabled ||
    hasErrors ||
    (canViewBp &&
      canEditField(editableFields, 'bp_activity') &&
      bpData.hasBpData &&
      !bpLinking.bpId)
  const disableUpdate =
    !specificFieldsLoaded ||
    (project.version >= 3 || isWithdrawn ? disableSubmit : isSaveDisabled) ||
    (postExComUpdate &&
      !(
        projIdentifiers.post_excom_meeting &&
        projIdentifiers.post_excom_decision
      ))

  const disableApprovalActions =
    !specificFieldsLoaded ||
    approvalFields.length === 0 ||
    hasOdsOdpErrors ||
    hasSectionErrors(approvalErrors) ||
    crossCuttingErrors['total_fund'].length > 0 ||
    crossCuttingErrors['support_cost_psc'].length > 0

  const { deletedFilesIds = [], newFiles = [] } = files || {}

  const handleErrors = async (error: any, type?: string) => {
    const errors = await error.json()

    if (error.status === 400) {
      setErrors(errors)

      if (errors?.files) {
        setFileErrors(errors.files)
      }

      if (errors?.metadata) {
        setFileErrors(errors.metadata)
      }

      if (errors?.details) {
        setOtherErrors(errors.details)
      }

      if (type === 'files' && errors?.error) {
        setFileErrors(errors.error)
      }
    }

    setProjectId(null)
    enqueueSnackbar(<>An error occurred. Please try again.</>, {
      variant: 'error',
    })
  }

  const editProject = async (navigationPage?: string) => {
    setIsLoading(true)
    setFileErrors('')
    setOtherErrors('')
    setErrors({})

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
        formatProjectFields(projectFields),
      )

      if (postExComUpdate) {
        data['post-excom-update'] = true
      }

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
        await api(`/api/projects/v2/${id}/project-files/delete`, {
          data: {
            file_ids: deletedFilesIds,
          },
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'DELETE',
        })
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
      }

      if (isApproved) {
        const actualData = getActualData(
          projectData,
          setProjectData,
          specificFields,
          formatProjectFields(projectFields),
        )
        await api(`api/projects/v2/${id}/edit_actual_fields/`, {
          data: actualData,
          method: 'PUT',
        })
      }

      setProjectId(result.id)
      setProjectTitle(result.title)

      if (navigationPage) {
        setLocation(`/projects-listing/${id}/${navigationPage}`)
      }

      if (isRecommended || isAfterApproval) {
        await editApprovalFields()
      }

      if (postExComUpdate) {
        setParams((prev: any) => ({ ...prev }))
      }

      return true
    } catch (error) {
      await handleErrors(error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitProject = () => {
    if (showSubmitTranchesWarningModal) {
      setIsTrancheWarningOpen(true)
    } else {
      setIsSubmitModalOpen(true)
    }
  }

  const onSendBackToDraftProject = () => {
    setIsSendToDraftModalOpen(true)
  }

  const onWithdrawProject = () => {
    setIsWithdrawModalOpen(true)
  }

  const onRecommendProject = () => {
    setIsRecommendModalOpen(true)
  }

  const sendProjectBackToDraft = async () => {
    const canSendBackToDraft = await editProject()

    if (canSendBackToDraft) {
      try {
        await api(`api/projects/v2/${id}/send_back_to_draft/`, {
          method: 'POST',
        })
        setLocation(`/projects-listing/${id}`)
        enqueueSnackbar(<>Project(s) sent back to draft successfully.</>, {
          variant: 'success',
        })
      } catch (error) {
        enqueueSnackbar(
          <>Could not send project(s) back to draft. Please try again.</>,
          {
            variant: 'error',
          },
        )
      }
    }
    setIsSendToDraftModalOpen(false)
  }

  const withdrawProject = async () => {
    const canWithdraw = await editProject()

    if (canWithdraw) {
      try {
        await api(`api/projects/v2/${id}/withdraw/`, {
          method: 'POST',
        })
        setLocation(`/projects-listing/${id}`)
      } catch (error) {
        enqueueSnackbar(<>Could not withdraw project. Please try again.</>, {
          variant: 'error',
        })
      }
    }
    setIsWithdrawModalOpen(false)
  }

  const editApprovalFields = async () => {
    setIsLoading(true)
    setOtherErrors('')
    setErrors({})

    try {
      const data = formatApprovalData(
        projectData,
        setProjectData,
        [...specificFields, ...approvalFields],
        formatProjectFields(projectFields),
      )
      const result = await api(`api/projects/v2/${id}/edit_approval_fields/`, {
        data: data,
        method: 'PUT',
      })

      setProjectId(result.id)
      return true
    } catch (error) {
      await handleErrors(error)
      setProjectId(null)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const approveRejectProject = async (action: string) => {
    const canApprove = await editApprovalFields()

    if (canApprove) {
      try {
        await api(`api/projects/v2/${id}/${action}/`, {
          method: 'POST',
        })
        setLocation(`/projects-listing/${id}`)
      } catch (error) {
        await handleErrors(error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="container flex w-full flex-wrap gap-x-3 gap-y-2 px-0">
      <CancelLinkButton title="Cancel" href="/projects-listing/listing" />
      {canEditProject && (
        <Button
          className={cx('px-4 py-2 shadow-none', {
            [enabledButtonClassname]: !disableUpdate,
          })}
          size="large"
          variant="contained"
          onClick={() => {
            editProject()
          }}
          disabled={disableUpdate}
        >
          Update project
        </Button>
      )}
      {canUpdateProjects && (isDraft || isSubmitted || isRecommended) && (
        <Button
          className={cx('px-4 py-2 shadow-none', enabledButtonClassname)}
          size="large"
          variant="contained"
          onClick={() => setIsComponentModalOpen(true)}
        >
          Add additional component
        </Button>
      )}
      {canSubmitProjects && isDraft && (
        <IncreaseVersionButton
          title="Submit project"
          onSubmit={onSubmitProject}
          isDisabled={disableSubmit}
        />
      )}
      {canRecommendProjects && isSubmitted && (
        <Dropdown
          className={dropDownClassName}
          ButtonProps={DropDownButtonProps}
          MenuProps={DropDownMenuProps}
          label={<>Approval</>}
        >
          <Dropdown.Item
            disabled={disableSubmit}
            className={cx(dropdownItemClassname, 'text-primary')}
            onClick={onRecommendProject}
          >
            Recommend project
          </Dropdown.Item>
          <Divider className="m-0" />
          <Dropdown.Item
            disabled={disableUpdate}
            className={cx(dropdownItemClassname, 'text-red-900')}
            onClick={onSendBackToDraftProject}
          >
            Send project back to draft
          </Dropdown.Item>
          <Divider className="m-0" />
          <Dropdown.Item
            disabled={disableUpdate}
            className={cx(dropdownItemClassname, 'text-red-900')}
            onClick={onWithdrawProject}
          >
            Withdraw project
          </Dropdown.Item>
        </Dropdown>
      )}
      {canApproveProjects && isRecommended && (
        <Dropdown
          className={dropDownClassName}
          ButtonProps={DropDownButtonProps}
          MenuProps={DropDownMenuProps}
          label={<>Approval</>}
        >
          <Dropdown.Item
            disabled={disableApprovalActions}
            className={cx(dropdownItemClassname, 'text-primary')}
            onClick={() => approveRejectProject('approve')}
          >
            Approve project
          </Dropdown.Item>
          <Divider className="m-0" />
          <Dropdown.Item
            disabled={disableApprovalActions}
            className={cx(dropdownItemClassname, 'text-red-900')}
            onClick={() => approveRejectProject('reject')}
          >
            Not approve project
          </Dropdown.Item>
        </Dropdown>
      )}
      <EditActionModals
        {...{
          id,
          isComponentModalOpen,
          setIsComponentModalOpen,
          isSubmitModalOpen,
          setIsSubmitModalOpen,
          isRecommendModalOpen,
          setIsRecommendModalOpen,
          isWithdrawModalOpen,
          setIsWithdrawModalOpen,
          isSendToDraftModalOpen,
          setIsSendToDraftModalOpen,
          setIsTrancheWarningOpen,
          editProject,
          withdrawProject,
          sendProjectBackToDraft,
        }}
        isTrancheWarningOpen={
          !!showSubmitTranchesWarningModal && isTrancheWarningOpen
        }
      />
    </div>
  )
}

export default EditActionButtons
