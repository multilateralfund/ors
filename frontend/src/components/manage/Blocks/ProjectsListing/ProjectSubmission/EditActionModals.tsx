import CancelWarningModal from './CancelWarningModal'
import AddComponentModal from './AddComponentModal'
import ChangeVersionModal from './ChangeVersionModal'
import ChangeStatusModal from './ChangeStatusModal'
import SendProjectToDraftModal from './SendProjectToDraftModal'
import SubmitTranchesWarningModal from './SubmitTranchesWarningModal'
import ApprovalModal from './ApprovalModal'

const EditActionModals = ({
  id,
  isCancelModalOpen,
  setIsCancelModalOpen,
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
  approvalModalType,
  setApprovalModalType,
  isTrancheWarningOpen,
  setIsTrancheWarningOpen,
  editProject,
  withdrawProject,
  sendProjectBackToDraft,
  approveRejectProject,
}: {
  id: number
  isCancelModalOpen?: boolean
  setIsCancelModalOpen?: (isOpen: boolean) => void
  isComponentModalOpen?: boolean
  setIsComponentModalOpen?: (isOpen: boolean) => void
  isSubmitModalOpen: boolean
  setIsSubmitModalOpen: (isOpen: boolean) => void
  isRecommendModalOpen: boolean
  setIsRecommendModalOpen: (isOpen: boolean) => void
  isWithdrawModalOpen: boolean
  setIsWithdrawModalOpen: (isOpen: boolean) => void
  isSendToDraftModalOpen: boolean
  setIsSendToDraftModalOpen: (isOpen: boolean) => void
  approvalModalType?: string | null
  setApprovalModalType?: (approvalType: string | null) => void
  isTrancheWarningOpen: boolean
  setIsTrancheWarningOpen: (isOpen: boolean) => void
  editProject?: (navigationPage?: string) => void
  withdrawProject: () => void
  sendProjectBackToDraft: () => void
  approveRejectProject?: (action: string) => void
}) => (
  <>
    {isCancelModalOpen && setIsCancelModalOpen && (
      <CancelWarningModal
        mode="editing"
        isModalOpen={isCancelModalOpen}
        setIsModalOpen={setIsCancelModalOpen}
      />
    )}
    {isComponentModalOpen && setIsComponentModalOpen && (
      <AddComponentModal
        id={id}
        isModalOpen={isComponentModalOpen}
        setIsModalOpen={setIsComponentModalOpen}
      />
    )}
    {isSubmitModalOpen && (
      <ChangeVersionModal
        mode="submit"
        isModalOpen={isSubmitModalOpen}
        setIsModalOpen={setIsSubmitModalOpen}
        {...{ id, editProject }}
      />
    )}
    {isRecommendModalOpen && (
      <ChangeVersionModal
        mode="recommend"
        isModalOpen={isRecommendModalOpen}
        setIsModalOpen={setIsRecommendModalOpen}
        {...{ id, editProject }}
      />
    )}
    {isWithdrawModalOpen && (
      <ChangeStatusModal
        isModalOpen={isWithdrawModalOpen}
        setIsModalOpen={setIsWithdrawModalOpen}
        onAction={withdrawProject}
      />
    )}
    {!!approvalModalType && setApprovalModalType && approveRejectProject && (
      <ApprovalModal
        type={approvalModalType}
        isModalOpen={!!approvalModalType}
        setModalType={setApprovalModalType}
        onAction={approveRejectProject}
      />
    )}
    {isSendToDraftModalOpen && (
      <SendProjectToDraftModal
        id={id}
        isModalOpen={isSendToDraftModalOpen}
        setIsModalOpen={setIsSendToDraftModalOpen}
        onAction={sendProjectBackToDraft}
      />
    )}
    {isTrancheWarningOpen && (
      <SubmitTranchesWarningModal
        {...{
          isTrancheWarningOpen,
          setIsTrancheWarningOpen,
          setIsSubmitModalOpen,
        }}
      />
    )}
  </>
)

export default EditActionModals
