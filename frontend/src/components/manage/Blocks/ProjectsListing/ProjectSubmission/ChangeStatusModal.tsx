import CustomLink from '@ors/components/ui/Link/Link'
import { CancelButton } from '../HelperComponents'

import { Typography, Box, Modal } from '@mui/material'

const ChangeStatusModal = ({
  isModalOpen,
  setIsModalOpen,
  onAction,
}: {
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
  onAction: () => void
}) => {
  const title = 'Withdraw project'
  const text = 'withdraw the project'

  return (
    <Modal
      aria-labelledby="change-status-modal-title"
      open={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      keepMounted
    >
      <Box className="flex w-full max-w-lg flex-col absolute-center">
        <Typography className="mb-4 text-[20px] font-medium text-black">
          {title}
        </Typography>
        <Typography className="mb-4 text-lg text-primary">
          Are you sure you want to {text}?
        </Typography>
        <div className="ml-auto mr-6 flex flex-wrap gap-3">
          <CustomLink
            className="h-10 px-4 py-2 text-lg uppercase"
            onClick={onAction}
            href={null}
            color="secondary"
            variant="contained"
            button
          >
            {title}
          </CustomLink>
          <CancelButton onClick={() => setIsModalOpen(false)} />
        </div>
      </Box>
    </Modal>
  )
}

export default ChangeStatusModal
