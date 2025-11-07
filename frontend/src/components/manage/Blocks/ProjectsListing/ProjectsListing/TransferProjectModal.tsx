import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { CancelButton } from '../HelperComponents'
import { useGetProject } from '../hooks/useGetProject'
import { ProjectTypeApi } from '../interfaces'

import { Modal, Typography, Box } from '@mui/material'

const ProjectTransfer = ({
  project,
  setIsModalOpen,
}: {
  project: ProjectTypeApi
  setIsModalOpen: (isOpen: boolean) => void
}) => {
  const transferProject = () => {}

  return (
    <div className="ml-auto mr-6 flex flex-wrap gap-3">
      <CustomLink
        className="h-10 px-4 py-2 text-lg uppercase"
        onClick={transferProject}
        href={null}
        color="secondary"
        variant="contained"
        button
      >
        Transfer project
      </CustomLink>
      <CancelButton onClick={() => setIsModalOpen(false)} />
    </div>
  )
}

const TransferProjectModal = ({
  id,
  isModalOpen,
  setIsModalOpen,
}: {
  id: number
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
}) => {
  const project = useGetProject(id.toString())
  const { data, loading } = project

  return (
    <Modal
      aria-labelledby="transfer-modal"
      open={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      keepMounted
    >
      <Box className="flex w-full max-w-lg flex-col px-0 absolute-center md:max-w-2xl">
        <Typography className="mx-6 mb-4 mt-1 text-2xl font-medium">
          Transfer project
        </Typography>
        <Loading
          className="!fixed bg-action-disabledBackground"
          active={loading}
        />
        {!loading && data && (
          <ProjectTransfer project={data} {...{ setIsModalOpen }} />
        )}
      </Box>
    </Modal>
  )
}

export default TransferProjectModal
