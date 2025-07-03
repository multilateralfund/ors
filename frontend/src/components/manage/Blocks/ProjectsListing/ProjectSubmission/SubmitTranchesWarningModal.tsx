import { SubmitButton } from '../HelperComponents'
import { Typography, Box, Button, Modal } from '@mui/material'

const SubmitTranchesWarningModal = ({
  submitProject,
  isTrancheWarningOpen,
  setIsTrancheWarningOpen,
}: {
  submitProject: () => void
  isTrancheWarningOpen: boolean
  setIsTrancheWarningOpen: (isModalOpen: boolean) => void
}) => {
  const onSubmit = () => {
    submitProject()
    setIsTrancheWarningOpen(false)
  }

  return (
    <Modal
      aria-labelledby="tranche-warning-modal-title"
      open={isTrancheWarningOpen}
      onClose={() => setIsTrancheWarningOpen(false)}
      keepMounted
    >
      <Box className="flex w-full max-w-lg flex-col absolute-center">
        <Typography className="mb-4 text-[20px] font-medium text-black">
          Submit project
        </Typography>
        <Typography className="mb-4 text-lg text-primary">
          Not all actual values of the indicators were filled in for the
          previous tranche(s) of this project. Are you sure you want to continue
          with the submission of the current tranche?
        </Typography>
        <div className="ml-auto flex gap-1">
          <SubmitButton title="Submit" onSubmit={onSubmit} />
          <Button
            className="border border-solid border-[#F2F2F2] bg-[#F2F2F2] text-base leading-none text-[#4D4D4D] hover:border-primary hover:bg-[#F2F2F2] hover:text-[#4D4D4D]"
            onClick={() => setIsTrancheWarningOpen(false)}
          >
            Close
          </Button>
        </div>
      </Box>
    </Modal>
  )
}

export default SubmitTranchesWarningModal
