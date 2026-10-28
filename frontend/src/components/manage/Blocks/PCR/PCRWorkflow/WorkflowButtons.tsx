import { useContext, useState } from 'react'

import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { IncreaseVersionButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ChangeVersionModal from './ChangeVersionModal'

import { enqueueSnackbar } from 'notistack'
import { useLocation } from 'wouter'
import cx from 'classnames'

const WorkflowButtons = ({
  editPCR,
  isSaveDisabled,
}: {
  editPCR?: (showSuccess?: boolean) => Promise<boolean>
  isSaveDisabled?: boolean
}) => {
  const { pcr } = useContext(PCRDataContext)
  const { status } = pcr.data ?? {}

  // const [_, setLocation] = useLocation()

  const [modalType, setModalType] = useState<string | null>(null)

  // const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  // const [isComponentModalOpen, setIsComponentModalOpen] = useState(false)
  // const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  // const [isSendToDraftModalOpen, setIsSendToDraftModalOpen] = useState(false)
  // const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  // const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false)
  // const [approvalModalType, setApprovalModalType] = useState<string | null>(
  //   null,
  // )

  // const submissionStatus = lowerCase(submission_status)
  // const isDraft = submissionStatus === 'draft'
  // const isSubmitted = submissionStatus === 'submitted'
  // const isRecommended = submissionStatus === 'recommended'

  // const handleErrors = async (error: any, type?: string) => {
  //   let errors: any = {}

  //   if (error instanceof Response) {
  //     const contentType = error.headers.get('content-type') || ''

  //     if (contentType.includes('application/json')) {
  //       errors = await error.json()
  //     } else {
  //       enqueueSnackbar(<>An error occurred. Please try again.</>, {
  //         variant: 'error',
  //       })

  //       return
  //     }

  //     if (error.status === 400) {
  //       setErrors(errors)
  //     }
  //   }

  //   enqueueSnackbar(<>An error occurred. Please try again.</>, {
  //     variant: 'error',
  //   })
  // }

  const onSubmit = () => {
    setModalType('submit')
  }

  // const onSendBackToDraftProject = () => {
  //   setIsSendToDraftModalOpen(true)
  // }

  // const onWithdrawProject = () => {
  //   setIsWithdrawModalOpen(true)
  // }

  // const onRecommendProject = () => {
  //   setIsRecommendModalOpen(true)
  // }

  // const onApproveRejectProject = (action: string) => {
  //   setApprovalModalType(action)
  // }

  // const sendProjectBackToDraft = async () => {
  //   const canSendBackToDraft = await editProject()

  //   if (canSendBackToDraft) {
  //     try {
  //       await api(`api/projects/v2/${id}/send_back_to_draft/`, {
  //         method: 'POST',
  //       })
  //       setLocation(`/projects-listing/${id}`)
  //       enqueueSnackbar(<>Project(s) sent back to draft successfully.</>, {
  //         variant: 'success',
  //       })
  //     } catch (error) {
  //       enqueueSnackbar(
  //         <>Could not send project(s) back to draft. Please try again.</>,
  //         {
  //           variant: 'error',
  //         },
  //       )
  //     }
  //   }
  //   setIsSendToDraftModalOpen(false)
  // }

  // const withdrawProject = async () => {
  //   const canWithdraw = await editProject()

  //   if (canWithdraw) {
  //     try {
  //       await api(`api/projects/v2/${id}/withdraw/`, {
  //         method: 'POST',
  //       })
  //       setLocation(`/projects-listing/${id}`)

  //       enqueueSnackbar(<>Project withdrawn successfully.</>, {
  //         variant: 'success',
  //       })
  //     } catch (error) {
  //       enqueueSnackbar(<>Could not withdraw project. Please try again.</>, {
  //         variant: 'error',
  //       })
  //     }
  //   }
  //   setIsWithdrawModalOpen(false)
  // }

  // const approveRejectProject = async (action: string) => {
  //   const updatedSuccessfully = await editProject()

  //   if (updatedSuccessfully) {
  //     try {
  //       await api(`api/projects/v2/${id}/${action}/`, {
  //         method: 'POST',
  //       })

  //       const actionType = action === 'approve' ? 'approved' : 'not approved'

  //       enqueueSnackbar(<>Project {actionType} successfully.</>, {
  //         variant: 'success',
  //       })
  //       setLocation(`/projects-listing/${id}`)
  //     } catch (error) {
  //       await handleErrors(error)
  //     }
  //   }

  //   setApprovalModalType(null)
  // }

  return (
    <>
      {status === 'Draft' && (
        <IncreaseVersionButton
          title="Submit PCR"
          onSubmit={onSubmit}
          isDisabled={isSaveDisabled}
          className={cx({ 'border border-solid': isSaveDisabled })}
        />
      )}
      {/*
      {isSubmitted && (
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
      {isRecommended && (
        <Dropdown
          className={dropDownClassName}
          ButtonProps={DropDownButtonProps}
          MenuProps={DropDownMenuProps}
          label={<>Approval</>}
        >
          <Dropdown.Item
            disabled={disableApprovalActions || disableApprove}
            className={cx(dropdownItemClassname, 'text-primary')}
            onClick={() => onApproveRejectProject('approve')}
          >
            Approve project
          </Dropdown.Item>
          <Divider className="m-0" />
          <Dropdown.Item
            disabled={disableApprovalActions}
            className={cx(dropdownItemClassname, 'text-red-900')}
            onClick={() => onApproveRejectProject('reject')}
          >
            Not approve project
          </Dropdown.Item>
        </Dropdown>
      )}
      */}
      <ChangeVersionModal {...{ modalType, setModalType, editPCR }} />
    </>
  )
}

export default WorkflowButtons
