import Link from '@ors/components/ui/Link/Link'
import { Button, Modal, Typography, Box } from '@mui/material'

const AddComponentModal = ({
  id,
  isModalOpen,
  setIsModalOpen,
}: {
  id: number
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
}) => (
  <Modal
    aria-labelledby="add-component-modal-title"
    open={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    keepMounted
  >
    <Box className="flex w-full max-w-lg flex-col absolute-center">
      <Typography className="mb-4 text-xl">
        Start from a copy of this project or from a blank submission?
      </Typography>
      <div className="ml-auto flex gap-1">
        <Link
          component="a"
          className="no-underline"
          target="_blank"
          rel="noopener noreferrer nofollow"
          href={`/projects-listing/create/${id}/full-copy/additional-component`}
        >
          <Button className="text-base" onClick={() => setIsModalOpen(false)}>
            Copy of project
          </Button>
        </Link>

        <Link
          component="a"
          className="no-underline"
          target="_blank"
          rel="noopener noreferrer nofollow"
          href={`/projects-listing/create/${id}/partial-copy/additional-component`}
        >
          <Button className="text-base" onClick={() => setIsModalOpen(false)}>
            Blank submission
          </Button>
        </Link>
        <Button className="text-base" onClick={() => setIsModalOpen(false)}>
          Close
        </Button>
      </div>
    </Box>
  </Modal>
)

export default AddComponentModal
