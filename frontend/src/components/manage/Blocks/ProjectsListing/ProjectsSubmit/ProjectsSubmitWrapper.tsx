'use client'

import { useEffect, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import ProjectsSubmit from './ProjectsSubmit'
import { useGetAssociatedProjects } from '../hooks/useGetAssociatedProjects'
import { AssociatedProjectsType } from '../interfaces'

import { Redirect, useParams } from 'wouter'
import { debounce, isNull } from 'lodash'

const ProjectsSubmitWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()
  const isFirstRender = useRef(false)

  const [association, setAssociation] = useState<AssociatedProjectsType>({
    projects: [],
    loaded: false,
  })
  const { projects: associatedProjects = [], loaded } = association

  const debouncedGetAssociatedProjects = debounce(() => {
    useGetAssociatedProjects(
      parseInt(project_id),
      setAssociation,
      'only_components',
      true,
      true,
    )
  }, 0)

  useEffect(() => {
    debouncedGetAssociatedProjects()

    if (!isFirstRender.current) {
      isFirstRender.current = true
    }
  }, [])

  if (loaded && isNull(associatedProjects)) {
    return <Redirect to="/projects-listing" />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={!loaded && !isFirstRender.current}
      />
      {associatedProjects && (
        <ProjectsSubmit {...{ associatedProjects, loaded, setAssociation }} />
      )}
    </>
  )
}

export default ProjectsSubmitWrapper
