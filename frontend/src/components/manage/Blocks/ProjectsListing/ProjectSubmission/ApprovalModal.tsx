import CustomLink from '@ors/components/ui/Link/Link'
import { CancelButton } from '../HelperComponents'

import { Typography, Box, Modal } from '@mui/material'
import { capitalize } from 'lodash'

const ApprovalModal = ({
  type,
  isModalOpen,
  setModalType,
  onAction,
}: {
  type: string
  isModalOpen: boolean
  setModalType: (modalType: string | null) => void
  onAction: (action: string) => void
}) => {
  const formattedType = type === 'approve' ? type : 'not approve'
  const title = capitalize(formattedType) + ' project'

  return (
    <Modal
      aria-labelledby="approval-modal"
      open={isModalOpen}
      onClose={() => setModalType(null)}
      keepMounted
    >
      <Box className="flex w-full max-w-[90%] flex-col absolute-center md:max-w-lg">
        <Typography className="mb-4 text-[20px] font-medium text-black">
          {title}
        </Typography>
        <Typography className="mb-4 text-lg text-primary">
          Are you sure you want to {formattedType} the project?
        </Typography>
        <div className="mr-2 flex flex-wrap justify-end gap-3">
          <CustomLink
            className="h-10 px-4 py-2 text-lg uppercase"
            onClick={() => onAction(type)}
            href={null}
            color="secondary"
            variant="contained"
            button
          >
            {title}
          </CustomLink>
          <CancelButton onClick={() => setModalType(null)} />
        </div>
      </Box>
    </Modal>
  )
}

export default ApprovalModal
