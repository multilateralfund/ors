'use client'

import { useEffect, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import ProjectsAssociateSelection from './ProjectsAssociateSelection'
import ProjectsAssociateConfirmation from './ProjectsAssociateConfirmation'
import { useGetProjectsAssociation } from '../hooks/useGetProjectsAssociation'
import { useGetAssociatedProjects } from '../hooks/useGetAssociatedProjects'
import { AssociatedProjectsType, ProjectTypeApi } from '../interfaces'
import { initialFilters } from '../constants'
import { useStore } from '@ors/store'

import { debounce, find } from 'lodash'
import { Box } from '@mui/material'
import { useParams } from 'wouter'

const ProjectsAssociate = ({ project }: { project: ProjectTypeApi }) => {
  const initialProjectsAssociation = useRef<ReturnType<
    typeof useGetProjectsAssociation
  > | null>(null)
  const { project_id } = useParams<Record<string, string>>()

  const [associationIds, setAssociationIds] = useState<number[]>([])
  const [filters, setFilters] = useState({ ...initialFilters })
  const [mode, setMode] = useState('selection')

  const projectSlice = useStore((state) => state.projects)
  const submissionStatuses = projectSlice.submission_statuses.data

  const approvedStatus = find(
    submissionStatuses,
    (status) => status.name === 'Approved',
  )

  const projectsAssociation = useGetProjectsAssociation(
    {
      ...initialFilters,
      limit: 50,
      submission_status_id: approvedStatus?.id ?? null,
    },
    project_id,
  )
  const { loading, loaded } = projectsAssociation

  const [association, setAssociation] = useState<AssociatedProjectsType>({
    projects: [],
    loaded: false,
  })
  const {
    projects: associatedProjects = [],
    loaded: loadedAssociatedProjects,
  } = association

  const debouncedGetAssociatedProjects = debounce(() => {
    useGetAssociatedProjects(
      parseInt(project_id),
      setAssociation,
      'all',
      false,
      false,
      false,
    )
  }, 0)

  useEffect(() => {
    debouncedGetAssociatedProjects()
  }, [])

  const allCrtProjects =
    associatedProjects && associatedProjects.length > 0
      ? [project, ...associatedProjects]
      : [project]
  const crtProjectsSelection = allCrtProjects.map((project, index) => {
    return {
      ...project,
      title: (index === 0 ? '' : '[associated] ') + project.title,
    }
  })
  const crtProjectsConfirmation = allCrtProjects.map((project) => {
    return { ...project, is_current_project: true }
  })

  useEffect(() => {
    if (!initialProjectsAssociation.current && loaded) {
      initialProjectsAssociation.current = projectsAssociation
    }
  }, [projectsAssociation])

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading || !loadedAssociatedProjects}
      />
      <Box className="my-2 flex flex-col gap-6 shadow-none">
        {mode === 'selection' ? (
          <ProjectsAssociateSelection
            crtProjects={crtProjectsSelection}
            {...{
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
            projectsAssociation={
              initialProjectsAssociation.current as ReturnType<
                typeof useGetProjectsAssociation
              >
            }
            crtProjects={crtProjectsConfirmation}
            {...{
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
