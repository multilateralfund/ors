import CustomLink from '@ors/components/ui/Link/Link'
import { CancelButton } from '../../HelperComponents'

import { Typography, Box, Modal } from '@mui/material'

const ChangeStatusModal = ({
  type,
  modalType,
  setIsModalOpen,
  onAction,
}: {
  type: string
  modalType: string
  setIsModalOpen: (modalType: string | null) => void
  onAction: (status: string) => Promise<void>
}) => {
  const isApprovedModal = modalType === 'Approved'

  const modalAction = isApprovedModal
    ? `Approve ${type}`
    : 'Mark enterprise as obsolete'
  const modalText = isApprovedModal
    ? `approve this ${type}?`
    : 'mark this enterprise as obsolete? All related project enterprises will be marked as obsolete.'

  return (
    <Modal
      aria-labelledby="change-status-modal"
      open={!!modalType}
      onClose={() => setIsModalOpen(null)}
      keepMounted
    >
      <Box className="flex w-full max-w-[90%] flex-col absolute-center md:max-w-lg">
        <Typography className="mb-4 text-[20px] font-medium text-black">
          {modalAction}
        </Typography>
        <Typography className="mb-4 text-lg text-primary">
          Are you sure you want to {modalText}
        </Typography>
        <div className="mr-3 flex flex-wrap justify-end gap-3">
          <CustomLink
            className="px-4 py-2 text-lg uppercase"
            onClick={() => onAction(modalType)}
            href={null}
            color="secondary"
            variant="contained"
            button
          >
            {modalAction}
          </CustomLink>
          <CancelButton onClick={() => setIsModalOpen(null)} />
        </div>
      </Box>
    </Modal>
  )
}

export default ChangeStatusModal
