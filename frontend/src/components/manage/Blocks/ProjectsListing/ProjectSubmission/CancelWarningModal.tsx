import CustomLink from '@ors/components/ui/Link/Link'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext'

import { Typography, Box, Modal } from '@mui/material'
import { useLocation } from 'wouter'

const CancelWarningModal = ({
  mode,
  url,
  isModalOpen,
  setIsModalOpen,
  onContinueAction,
}: {
  mode: string
  url?: string
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
  onContinueAction?: () => void
}) => {
  const [_, setLocation] = useLocation()
  const { clearUpdatedFields } = useUpdatedFields()

  const onContinue = () => {
    clearUpdatedFields()

    if (onContinueAction) {
      onContinueAction()
    } else {
      setLocation(url ?? '/projects-listing/listing')
    }
    setIsModalOpen(false)
  }

  const onCancel = () => {
    setIsModalOpen(false)
  }

  return (
    <Modal
      aria-labelledby="cancel-modal"
      open={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      keepMounted
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      <Box className="flex w-full max-w-[90%] flex-col absolute-center sm:max-w-lg">
        <Typography className="mb-4 text-[20px] font-medium text-black">
          Cancel {mode}
        </Typography>
        <Typography className="mb-4 text-lg text-primary">
          You have unsaved changes. Are you sure you want to cancel {mode}?
        </Typography>
        <div className="mr-2 flex flex-wrap justify-end gap-3">
          <CustomLink
            className="h-8 px-4 py-2 text-lg uppercase"
            href={null}
            color="secondary"
            variant="contained"
            button
            onClick={onContinue}
          >
            Yes
          </CustomLink>
          <CustomLink
            className="boder-primary h-8 border border-solid bg-white px-4 py-2 text-lg uppercase text-primary"
            href={null}
            variant="contained"
            button
            onClick={onCancel}
          >
            No
          </CustomLink>
        </div>
      </Box>
    </Modal>
  )
}

export default CancelWarningModal
