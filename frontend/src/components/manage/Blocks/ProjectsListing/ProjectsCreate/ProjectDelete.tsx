import { useState } from 'react'

import ProjectDeleteModal from './ProjectDeleteModal'
import { ProjectTypeApi } from '../interfaces'
import { api } from '@ors/helpers'

import { enqueueSnackbar } from 'notistack'
import { IoTrash } from 'react-icons/io5'
import { useLocation } from 'wouter'

const ProjectDelete = ({
  project,
  hasComponents,
}: {
  project: ProjectTypeApi
  hasComponents: boolean
}) => {
  const [_, setLocation] = useLocation()

  const [showWarning, setShowWarning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const deleteProject = async () => {
    setIsLoading(true)

    try {
      await api(`api/projects/v2/${project.id}`, {
        method: 'DELETE',
      })

      enqueueSnackbar(<>Project deleted successfully.</>, {
        variant: 'success',
      })
      setLocation('/projects-listing/listing')
    } catch (e) {
      enqueueSnackbar(
        <>An error occurred during project deletion. Please try again.</>,
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
      <div
        className="flex cursor-pointer items-center justify-between gap-x-2 text-nowrap text-red-800"
        onClick={() => {
          setShowWarning(true)
        }}
      >
        <span>Delete project</span>
        <IoTrash className="text-xl" />
      </div>
      {showWarning && (
        <ProjectDeleteModal
          mode="delete"
          onOk={deleteProject}
          {...{ hasComponents, showWarning, setShowWarning, isLoading }}
        />
      )}
    </>
  )
}

export default ProjectDelete
