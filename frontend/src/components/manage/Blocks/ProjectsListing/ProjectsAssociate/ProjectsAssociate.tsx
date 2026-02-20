'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import useVisibilityChange from '@ors/hooks/useVisibilityChange'
import { initialParams } from '../ProjectsListing/ProjectsFiltersSelectedOpts'
import ProjectsAssociateSelection from './ProjectsAssociateSelection'
import ProjectsAssociateConfirmation from './ProjectsAssociateConfirmation'
import CancelWarningModal from '../ProjectSubmission/CancelWarningModal'
import { RedirectBackButton } from '../HelperComponents'
import { useGetAssociatedProjects } from '../hooks/useGetAssociatedProjects'
import { useGetProjectFilters } from '../hooks/useGetProjectFilters'
import { useGetProjects } from '../hooks/useGetProjects'
import { AssociatedProjectsType, ProjectTypeApi } from '../interfaces'
import { initialFilters } from '../constants'
import { useStore } from '@ors/store'

import { useLocation, useParams } from 'wouter'
import { debounce, find, map } from 'lodash'

const ProjectsAssociate = ({ project }: { project: ProjectTypeApi }) => {
  const [_, setLocation] = useLocation()

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
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [redirectOnCancel, setRedirectOnCancel] = useState(false)

  const updatedFilters = {
    ...filters,
    limit: 50,
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

  const onCancelAssociation = () => {
    if (associationIds.length > 0) {
      if (mode === 'selection') {
        setRedirectOnCancel(true)
      }
      setIsCancelModalOpen(true)
    } else {
      cancelAssociation()
    }
  }

  useVisibilityChange(associationIds.length > 0)

  const onCancel = () => {
    if (associationIds.length > 0) {
      setRedirectOnCancel(true)
      setIsCancelModalOpen(true)
    } else {
      setLocation('/projects-listing/listing')
    }
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading || !loadedAssociatedProjects}
      />
      <RedirectBackButton withRedirect={false} onAction={onCancel} />
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
            cancelAssociation={onCancelAssociation}
            {...{
              associationIds,
            }}
          />
        )}
      </div>
      {isCancelModalOpen && (
        <CancelWarningModal
          mode="project association"
          isModalOpen={isCancelModalOpen}
          setIsModalOpen={setIsCancelModalOpen}
          onContinueAction={redirectOnCancel ? undefined : cancelAssociation}
        />
      )}
    </>
  )
}

export default ProjectsAssociate
