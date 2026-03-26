import { useState } from 'react'

import ProjectDeleteModal from './ProjectDeleteModal'
import { ProjectTypeApi } from '../interfaces'
import { useStore } from '@ors/store'
import { api } from '@ors/helpers'

import { enqueueSnackbar } from 'notistack'
import { Button } from '@mui/material'

const ProjectDisassociate = ({
  project,
  hasComponents,
  setRefetchRelatedProjects,
}: {
  project: ProjectTypeApi
  hasComponents: boolean
  setRefetchRelatedProjects?: (refetch: boolean) => void
}) => {
  const { setInlineMessage } = useStore((state) => state.inlineMessage)

  const [showWarning, setShowWarning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const disassociateProject = async () => {
    setIsLoading(true)

    try {
      await api(`api/projects/v2/${project.id}/disassociate_component`, {
        method: 'POST',
      })

      const message = 'Project disassociated successfully.'

      enqueueSnackbar(<>{message}</>, {
        variant: 'success',
      })
      setInlineMessage({
        type: 'success',
        message: message,
        tabId: 'project-related-projects-section',
      })
      setRefetchRelatedProjects?.(true)
    } catch (e) {
      enqueueSnackbar(
        <>An error occurred during project disassociation. Please try again.</>,
        {
          variant: 'error',
        },
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="text-lg">
        To remove the linkage to the other components, click on
        <Button
          className="mx-1.5 mb-1 h-7 w-fit whitespace-nowrap px-2 pb-1.5 text-lg uppercase"
          size="large"
          variant="contained"
          onClick={() => {
            setShowWarning(true)
          }}
        >
          Disassociate
        </Button>
      </div>
      {showWarning && (
        <ProjectDeleteModal
          mode="disassociate"
          onOk={disassociateProject}
          {...{ hasComponents, showWarning, setShowWarning, isLoading }}
        />
      )}
    </>
  )
}

export default ProjectDisassociate
