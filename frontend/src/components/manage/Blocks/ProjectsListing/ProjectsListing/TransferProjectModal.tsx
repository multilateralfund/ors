import { useEffect, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import ProjectTransfer from './ProjectTransfer'
import { CancelButton } from '../HelperComponents'
import { useGetProject } from '../hooks/useGetProject'
import { getFormattedDecimalValue, getNonFieldErrors } from '../utils'
import { ProjectTransferData, ProjectTypeApi } from '../interfaces'
import { initialTranferedProjectData } from '../constants'

import { Modal, Typography, Box } from '@mui/material'

const ProjectTransferWrapper = ({
  project,
  setIsModalOpen,
}: {
  project: ProjectTypeApi
  setIsModalOpen: (isOpen: boolean) => void
}) => {
  const [projectData, setProjectData] = useState<ProjectTransferData>(
    initialTranferedProjectData,
  )
  const [files, setFiles] = useState([])
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)

  const [errors, setErrors] = useState<{ [key: string]: [] }>({})
  const [fileErrors, setFileErrors] = useState<string>('')
  const [otherErrors, setOtherErrors] = useState<string>('')

  const nonFieldsErrors = getNonFieldErrors(errors)

  useEffect(() => {
    setProjectData((prevData) => ({
      ...prevData,
      fund_transferred: getFormattedDecimalValue(project.total_fund),
      psc_transferred: getFormattedDecimalValue(project.support_cost_psc),
      psc_received: getFormattedDecimalValue(project.support_cost_psc),
    }))
  }, [])

  const transferProject = () => {}

  return (
    <>
      <ProjectTransfer
        {...{
          projectData,
          setProjectData,
          files,
          setFiles,
          errors,
          fileErrors,
          hasSubmitted,
        }}
      />
      <div className="ml-auto mr-6 mt-auto flex flex-wrap gap-3">
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
    </>
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
      <Box className="flex min-h-[250px] w-[80%] max-w-[1400px] flex-col overflow-y-auto rounded-2xl px-6 py-3 absolute-center 2xl:w-[60%]">
        <Typography className="mb-4 text-2xl font-medium">
          Transfer project
        </Typography>
        <Loading
          className="!fixed bg-action-disabledBackground"
          active={loading}
        />
        {!loading && data && (
          <ProjectTransferWrapper project={data} {...{ setIsModalOpen }} />
        )}
      </Box>
    </Modal>
  )
}

export default TransferProjectModal
