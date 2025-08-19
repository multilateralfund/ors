import { useContext, useMemo, useState } from 'react'

import { CancelLinkButton } from '@ors/components/ui/Button/Button'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import SubmitTranchesWarningModal from './SubmitTranchesWarningModal'
import SubmitProjectModal from './SubmitProjectModal'
import ChangeStatusModal from './ChangeStatusModal'
import AddComponentModal from './AddComponentModal'
import { IncreaseVersionButton } from '../HelperComponents'
import {
  checkInvalidValue,
  formatApprovalData,
  formatFiles,
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
} from '../interfaces'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { api, uploadFiles } from '@ors/helpers'

import { Button, ButtonProps, Divider, MenuProps } from '@mui/material'
import { MdKeyboardArrowDown } from 'react-icons/md'
import { enqueueSnackbar } from 'notistack'
import { find, lowerCase } from 'lodash'
import { useLocation } from 'wouter'
import cx from 'classnames'

const EditActionButtons = ({
  projectData,
  project,
  files,
  projectFiles,
  setProjectId,
  setProjectTitle,
  isSaveDisabled,
  isSubmitDisabled,
  setIsLoading,
  setHasSubmitted,
  setFileErrors,
  setOtherErrors,
  setErrors,
  setProjectFiles,
  specificFields,
  trancheErrors,
  approvalFields = [],
  specificFieldsLoaded,
}: ActionButtons & {
  setProjectTitle: (title: string) => void
  project: ProjectTypeApi
  isSubmitDisabled: boolean
  projectFiles?: ProjectFile[]
  setProjectFiles: (value: ProjectFile[]) => void
  trancheErrors?: TrancheErrorType
  approvalFields?: ProjectSpecificFields[]
}) => {
  const [_, setLocation] = useLocation()

  const {
    canUpdateProjects,
    canSubmitProjects,
    canRecommendProjects,
    canApproveProjects,
  } = useContext(PermissionsContext)

  const showSubmitTranchesWarningModal = trancheErrors?.tranchesData?.find(
    (tranche: RelatedProjectsType) => tranche.warnings.length > 0,
  )

  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false)
  const [isTrancheWarningOpen, setIsTrancheWarningOpen] = useState(false)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [isSendToDraftModalOpen, setIsSendToDraftModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)

  const { id, submission_status } = project
  const {
    crossCuttingFields,
    projectSpecificFields,
    approvalFields: approvalData,
  } = projectData
  const odsOdpData = projectSpecificFields?.ods_odp ?? []

  const submissionStatus = lowerCase(submission_status)
  const isDraft = submissionStatus === 'draft'
  const isSubmitted = submissionStatus === 'submitted'
  const isRecommended = submissionStatus === 'recommended'
  const isApproved = submissionStatus === 'approved'
  const isAfterApproval = isApproved || submissionStatus === 'not approved'

  const crossCuttingErrors = useMemo(
    () => getCrossCuttingErrors(crossCuttingFields, {}, 'edit', project),
    [crossCuttingFields],
  )
  const approvalErrors = useMemo(
    () => getApprovalErrors(approvalData, approvalFields, {}, project),
    [approvalData, approvalFields],
  )

  const specificErrors = useMemo(
    () =>
      getSpecificFieldsErrors(
        projectSpecificFields,
        specificFields,
        {},
        'edit',
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
    (getHasNoFiles(id, files, projectFiles) && (project?.version ?? 0) < 3)

  const hasErrors =
    commonErrors ||
    (isAfterApproval
      ? hasSectionErrors(specificErrorsApproval['Impact'] || {})
      : hasSectionErrors(impactErrors))

  const disableSubmit = !specificFieldsLoaded || isSubmitDisabled || hasErrors
  const disableUpdate =
    !specificFieldsLoaded ||
    (project.version === 3
      ? isAfterApproval
        ? disableSubmit ||
          hasSectionErrors(approvalErrors) ||
          approvalFields.length === 0
        : disableSubmit
      : isSaveDisabled)
  const disableApprovalActions =
    approvalFields.length === 0 ||
    hasOdsOdpErrors ||
    hasSectionErrors(approvalErrors) ||
    crossCuttingErrors['total_fund'].length > 0 ||
    crossCuttingErrors['support_cost_psc'].length > 0

  const { deletedFilesIds = [], newFiles = [] } = files || {}

  const handleErrors = async (error: any) => {
    const errors = await error.json()

    if (error.status === 400) {
      setErrors(errors)

      if (errors?.files) {
        setFileErrors(errors.files)
      }

      if (errors?.details) {
        setOtherErrors(errors.details)
      }
    }

    setProjectId(null)
    enqueueSnackbar(<>An error occurred. Please try again.</>, {
      variant: 'error',
    })
  }

  const editProject = async (withNavigation: boolean = false) => {
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

      const data = formatSubmitData(projectData, specificFields)
      const result = await api(`api/projects/v2/${id}`, {
        data: data,
        method: 'PUT',
      })

      if (isApproved) {
        const actualData = getActualData(projectData, specificFields)
        await api(`api/projects/v2/${id}/edit_actual_fields/`, {
          data: actualData,
          method: 'PUT',
        })
      }

      setProjectId(result.id)
      setProjectTitle(result.title)

      if (withNavigation) {
        setLocation(`/projects-listing/${id}/submit`)
      }

      if (canApproveProjects && isAfterApproval) {
        await editApprovalFields()
      }
    } catch (error) {
      await handleErrors(error)
    } finally {
      try {
        const res = await api(
          `/api/project/${id}/files/include_previous_versions/v2/`,
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
      setIsLoading(false)
      setHasSubmitted(false)
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

  const recommendProject = async () => {
    await editProject()
    try {
      await api(`api/projects/v2/${id}/recommend/`, {
        method: 'POST',
      })
      setLocation(`/projects-listing/${id}`)
    } catch (error) {
      await handleErrors(error)
    } finally {
      setIsLoading(false)
      setHasSubmitted(true)
    }
  }

  const sendProjectBackToDraft = async () => {
    await editProject()
    try {
      await api(`api/projects/v2/${id}/send_back_to_draft/`, {
        method: 'POST',
      })
      setLocation(`/projects-listing/${id}`)
    } catch (error) {
      enqueueSnackbar(
        <>Could not send project back to draft. Please try again.</>,
        {
          variant: 'error',
        },
      )
    } finally {
      setIsSendToDraftModalOpen(false)
    }
  }

  const withdrawProject = async () => {
    await editProject()
    try {
      await api(`api/projects/v2/${id}/withdraw/`, {
        method: 'POST',
      })
      setLocation(`/projects-listing/${id}`)
    } catch (error) {
      enqueueSnackbar(<>Could not withdraw project. Please try again.</>, {
        variant: 'error',
      })
    } finally {
      setIsWithdrawModalOpen(false)
    }
  }

  const editApprovalFields = async () => {
    setIsLoading(true)
    setOtherErrors('')
    setErrors({})

    try {
      const data = formatApprovalData(projectData, [
        ...specificFields,
        ...approvalFields,
      ])
      const result = await api(`api/projects/v2/${id}/edit_approval_fields/`, {
        data: data,
        method: 'PUT',
      })

      setProjectId(result.id)
    } catch (error) {
      await handleErrors(error)
      setProjectId(null)
    } finally {
      setIsLoading(false)
      setHasSubmitted(true)
    }
  }

  const approveRejectProject = async (action: string) => {
    await editApprovalFields()
    try {
      await api(`api/projects/v2/${id}/${action}/`, {
        method: 'POST',
      })
      setLocation(`/projects-listing/${id}`)
    } catch (error) {
      await handleErrors(error)
    } finally {
      setIsLoading(false)
      setHasSubmitted(true)
    }
  }

  const enabledButtonClassname =
    'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow'
  const dropDownClassName =
    'bg-primary px-4 py-2 text-white shadow-none hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow'
  const dropdownItemClassname = 'bg-transparent font-medium normal-case'

  const DropDownButtonProps: ButtonProps = {
    endIcon: <MdKeyboardArrowDown />,
    size: 'large',
    variant: 'contained',
  }
  const DropDownMenuProps: Omit<MenuProps, 'open'> = {
    PaperProps: {
      className: 'mt-1 border border-solid border-black rounded-lg',
    },
    transitionDuration: 0,
  }

  return (
    <div className="container flex w-full flex-wrap gap-x-3 gap-y-2 px-0">
      <CancelLinkButton title="Close" href={`/projects-listing/${id}`} />
      {canUpdateProjects && (
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
      {canUpdateProjects && (isDraft || isSubmitted) && (
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
          label={<>Edit project</>}
        >
          <Dropdown.Item
            disabled={disableSubmit}
            className={cx(dropdownItemClassname, 'text-primary')}
            onClick={recommendProject}
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
          label={<>Edit project</>}
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
      {isComponentModalOpen && (
        <AddComponentModal
          id={id}
          isModalOpen={isComponentModalOpen}
          setIsModalOpen={setIsComponentModalOpen}
        />
      )}
      {isSubmitModalOpen && (
        <SubmitProjectModal
          isModalOpen={isSubmitModalOpen}
          setIsModalOpen={setIsSubmitModalOpen}
          {...{ id, editProject }}
        />
      )}
      {isWithdrawModalOpen && (
        <ChangeStatusModal
          mode="withdraw"
          isModalOpen={isWithdrawModalOpen}
          setIsModalOpen={setIsWithdrawModalOpen}
          onAction={withdrawProject}
        />
      )}
      {isSendToDraftModalOpen && (
        <ChangeStatusModal
          mode="sendToDraft"
          isModalOpen={isSendToDraftModalOpen}
          setIsModalOpen={setIsSendToDraftModalOpen}
          onAction={sendProjectBackToDraft}
        />
      )}
      {showSubmitTranchesWarningModal && isTrancheWarningOpen && (
        <SubmitTranchesWarningModal
          {...{
            isTrancheWarningOpen,
            setIsTrancheWarningOpen,
            setIsSubmitModalOpen,
          }}
        />
      )}
    </div>
  )
}

export default EditActionButtons
