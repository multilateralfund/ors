'use client'

import { useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import ProjectsAssociateSelection from './ProjectsAssociateSelection'
import ProjectsAssociateConfirmation from './ProjectsAssociateConfirmation'
import { useGetProjectsAssociation } from '../hooks/useGetProjectsAssociation'
import { ProjectTypeApi } from '../interfaces'
import { initialFilters } from '../constants'

import { Box } from '@mui/material'

const ProjectsAssociate = ({ project }: { project: ProjectTypeApi }) => {
  const [associationIds, setAssociationIds] = useState<number[]>([])
  const [filters, setFilters] = useState({ ...initialFilters })
  const [mode, setMode] = useState('selection')

  const projectsAssociation = useGetProjectsAssociation(initialFilters)
  const { loading } = projectsAssociation

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <Box className="my-2 flex flex-col gap-6 shadow-none">
        {mode === 'selection' ? (
          <ProjectsAssociateSelection
            {...{
              project,
              projectsAssociation,
              associationIds,
              setAssociationIds,
              filters,
              setFilters,
              setMode,
            }}
          />
        ) : (
          <ProjectsAssociateConfirmation
            {...{
              project,
              projectsAssociation,
              associationIds,
              setAssociationIds,
              setFilters,
              setMode,
            }}
          />
        )}
      </Box>
    </>
  )
}

export default ProjectsAssociate
