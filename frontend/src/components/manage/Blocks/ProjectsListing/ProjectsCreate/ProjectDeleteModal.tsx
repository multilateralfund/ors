import CustomLink from '@ors/components/ui/Link/Link'
import { CancelButton } from '../HelperComponents'

import { Modal, Typography, Box, CircularProgress } from '@mui/material'
import { capitalize } from 'lodash'

const ProjectDeleteModal = ({
  mode,
  hasComponents,
  onOk,
  showWarning,
  setShowWarning,
  isLoading,
}: {
  mode: string
  hasComponents: boolean
  onOk: () => void
  showWarning: boolean
  setShowWarning: (showWarning: boolean) => void
  isLoading: boolean
}) => (
  <Modal
    aria-labelledby={`${mode}-project-modal`}
    open={showWarning}
    onClose={() => setShowWarning(false)}
  >
    <Box className="flex w-full max-w-xl flex-col absolute-center">
      <Typography className="mb-4 text-[20px] font-medium text-black">
        {capitalize(mode)} project
      </Typography>
      <Typography className="mb-4 text-lg text-primary">
        {hasComponents
          ? `This project is the original component for other projects, so the attachments uploaded here might not be uploaded on the other components. Before ${mode === 'delete' ? 'deleting' : 'disassociating'}, make sure the attachments were uploaded on the other component(s)! `
          : ''}
        Are you sure you want to {mode} the project?
      </Typography>
      <div className="ml-auto mr-3 flex flex-wrap gap-3">
        <CustomLink
          className="h-10 px-4 py-2 text-lg uppercase"
          onClick={onOk}
          href={null}
          color="secondary"
          variant="contained"
          button
        >
          {capitalize(mode)} project
        </CustomLink>
        <CancelButton onClick={() => setShowWarning(false)} />
        {isLoading && (
          <CircularProgress
            color="inherit"
            size="30px"
            className="text-align mb-1 ml-1.5 mt-auto"
          />
        )}
      </div>
    </Box>
  </Modal>
)

export default ProjectDeleteModal
