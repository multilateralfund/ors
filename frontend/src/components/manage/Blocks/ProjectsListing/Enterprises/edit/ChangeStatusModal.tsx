import CustomLink from '@ors/components/ui/Link/Link'
import { CancelButton } from '../../HelperComponents'

import { Typography, Box, Modal } from '@mui/material'

const ChangeStatusModal = ({
  isModalOpen,
  setIsModalOpen,
  onAction,
}: {
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
  onAction: (status: string) => Promise<void>
}) => (
  <Modal
    aria-labelledby="change-status-modal-title"
    open={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    keepMounted
  >
    <Box className="flex w-full max-w-lg flex-col absolute-center">
      <Typography className="mb-4 text-[20px] font-medium text-black">
        Mark enterprise as obsolete
      </Typography>
      <Typography className="mb-4 text-lg text-primary">
        Are you sure you want to mark this enterprise as obsolete? All related
        project enterprises will be marked as obsolete.
      </Typography>
      <div className="ml-auto mr-3 flex flex-wrap gap-3">
        <CustomLink
          className="h-10 px-4 py-2 text-lg uppercase"
          onClick={() => onAction('Obsolete')}
          href={null}
          color="secondary"
          variant="contained"
          button
        >
          Mark enterprise as obsolete
        </CustomLink>
        <CancelButton onClick={() => setIsModalOpen(false)} />
      </div>
    </Box>
  </Modal>
)

export default ChangeStatusModal
