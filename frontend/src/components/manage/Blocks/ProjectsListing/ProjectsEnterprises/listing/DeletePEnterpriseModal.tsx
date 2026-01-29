import CustomLink from '@ors/components/ui/Link/Link'
import { CancelButton } from '../../HelperComponents'

import { Typography, Box, Modal } from '@mui/material'

const DeletePEnterpriseModal = ({
  idToDelete,
  setIdToDelete,
  onAction,
}: {
  idToDelete: number | null
  setIdToDelete: (isOpen: number | null) => void
  onAction: () => Promise<void>
}) => {
  const handleCloseModal = () => {
    setIdToDelete(null)
  }

  return (
    <Modal
      aria-labelledby="delete-project-enterprise-modal"
      open={!!idToDelete}
      onClose={handleCloseModal}
      keepMounted
    >
      <Box className="flex w-full max-w-[90%] flex-col absolute-center md:max-w-lg">
        <Typography className="mb-4 text-[20px] font-medium text-black">
          Delete project enterprise
        </Typography>
        <Typography className="mb-4 text-lg text-primary">
          Are you sure you want to delete this project enterprise?
        </Typography>
        <div className="mr-3 flex flex-wrap justify-end gap-3">
          <CustomLink
            className="h-10 px-4 py-2 text-lg uppercase"
            onClick={onAction}
            href={null}
            color="secondary"
            variant="contained"
            button
          >
            Delete project enterprise
          </CustomLink>
          <CancelButton onClick={handleCloseModal} />
        </div>
      </Box>
    </Modal>
  )
}

export default DeletePEnterpriseModal
