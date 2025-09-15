import CustomLink from '@ors/components/ui/Link/Link'
import { CancelButton } from '../../HelperComponents'

import { Typography, Box, Modal } from '@mui/material'

const ChangeStatusModal = ({
  type,
  status,
  isModalOpen,
  setIsModalOpen,
  onAction,
}: {
  type: string
  status: string
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
  onAction: (status: string) => Promise<void>
}) => {
  const isPendingProjectEnteprise =
    status === 'Pending Approval' && type === 'project-enterprise'
  const title = isPendingProjectEnteprise
    ? 'Not approve project enterprise'
    : `Mark ${type === 'project-enterprises' ? 'project' : ''} enterprise as obsolete`
  const text = isPendingProjectEnteprise
    ? 'not approve this project enterprise'
    : `mark this ${type === 'project-enterprises' ? 'project' : ''} enterprise as obsolete`

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
          Are you sure you want to {text}?{' '}
          {type === 'enterprise'
            ? 'All related project enterprises will be marked as obsolete.'
            : ''}
        </Typography>
        <div className="ml-auto mr-6 flex flex-wrap gap-3">
          <CustomLink
            className="h-10 px-4 py-2 text-lg uppercase"
            onClick={() => onAction('Obsolete')}
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
