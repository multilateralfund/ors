import AddComponentModal from './AddComponentModal'
import ChangeVersionModal from './ChangeVersionModal'
import ChangeStatusModal from './ChangeStatusModal'
import SubmitTranchesWarningModal from './SubmitTranchesWarningModal'

const EditActionModals = ({
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
  isTrancheWarningOpen,
  setIsTrancheWarningOpen,
  editProject,
  withdrawProject,
  sendProjectBackToDraft,
}: {
  id: number
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
  isTrancheWarningOpen: boolean
  setIsTrancheWarningOpen: (isOpen: boolean) => void
  editProject?: (navigationPage?: string) => void
  withdrawProject: () => void
  sendProjectBackToDraft: () => void
}) => (
  <>
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
