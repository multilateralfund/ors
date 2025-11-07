'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import { initialParams } from '../ProjectsListing/ProjectsFiltersSelectedOpts'
import ProjectsAssociateSelection from './ProjectsAssociateSelection'
import ProjectsAssociateConfirmation from './ProjectsAssociateConfirmation'
import { useGetAssociatedProjects } from '../hooks/useGetAssociatedProjects'
import { useGetProjectFilters } from '../hooks/useGetProjectFilters'
import { useGetProjects } from '../hooks/useGetProjects'
import { AssociatedProjectsType, ProjectTypeApi } from '../interfaces'
import { initialFilters } from '../constants'
import { useStore } from '@ors/store'

import { debounce, find, map } from 'lodash'
import { useParams } from 'wouter'

const ProjectsAssociate = ({ project }: { project: ProjectTypeApi }) => {
  const { project_id } = useParams<Record<string, string>>()

  const initialProjectsAssociation = useRef<ReturnType<
    typeof useGetProjects
  > | null>(null)

  const projectSlice = useStore((state) => state.projects)
  const statuses = projectSlice.statuses.data
  const onGoingStatus = find(statuses, (status) => status.name === 'Ongoing')

  const [associationIds, setAssociationIds] = useState<number[]>([])
  const [mode, setMode] = useState('selection')
  const [filters, setFilters] = useState<any>({
    ...initialFilters,
    status_id: [onGoingStatus],
  })

  const updatedFilters = {
    ...filters,
    submission_status_id: project.submission_status_id,
    country_id: project.country_id,
    status_id: onGoingStatus?.id,
    exclude_projects: project_id,
  }

  const projectFilters = useGetProjectFilters(updatedFilters)
  const projectsForAssociation = useGetProjects(updatedFilters)
  const { loading, loaded, setParams } = projectsForAssociation

  const [association, setAssociation] = useState<AssociatedProjectsType>({
    projects: [],
    loaded: false,
  })
  const {
    projects: associatedProjects = [],
    loaded: loadedAssociatedProjects,
  } = association

  useEffect(() => {
    const { data, loading } = projectFilters
    const onGoingStatusId = onGoingStatus?.id

    if (
      !loading &&
      data &&
      onGoingStatusId &&
      filters.status_id?.includes(onGoingStatus)
    ) {
      const hasOngoingProjs = map(data?.status, 'id').includes(onGoingStatusId)

      if (!hasOngoingProjs) {
        const newParams = {
          ...filters,
          status_id: null,
        }

        setFilters(newParams)
        setParams(newParams)
        projectFilters.setParams(newParams)
      }
    }
  }, [projectFilters.loaded])

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
  const crtProjectsSelection = useMemo(
    () =>
      allCrtProjects.map((project, index) => ({
        ...project,
        title: (index === 0 ? '' : '[associated] ') + project.title,
      })),
    [associatedProjects],
  )
  const crtProjectsConfirmation = allCrtProjects.map((project) => ({
    ...project,
    is_current_project: true,
  }))

  useEffect(() => {
    if (!initialProjectsAssociation.current && loaded) {
      initialProjectsAssociation.current = projectsForAssociation
    }
  }, [projectsForAssociation])

  const cancelAssociation = () => {
    const currentParams = {
      ...initialFilters,
      ...initialParams,
      status_id: onGoingStatus?.id,
    }

    setMode('selection')
    setAssociationIds([])
    setFilters({ offset: 0, ...initialParams, status_id: [onGoingStatus] })
    setParams(currentParams)
    projectFilters.setParams(currentParams)
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading || !loadedAssociatedProjects}
      />
      <div className="flex flex-col gap-6">
        {mode === 'selection' ? (
          <ProjectsAssociateSelection
            crtProjects={crtProjectsSelection}
            {...{
              projectsForAssociation,
              associationIds,
              setAssociationIds,
              filters,
              setFilters,
              projectFilters,
              setMode,
            }}
          />
        ) : (
          <ProjectsAssociateConfirmation
            projectsAssociation={
              initialProjectsAssociation.current as ReturnType<
                typeof useGetProjects
              >
            }
            crtProjects={crtProjectsConfirmation}
            {...{
              associationIds,
              cancelAssociation,
            }}
          />
        )}
      </div>
    </>
  )
}

export default ProjectsAssociate
