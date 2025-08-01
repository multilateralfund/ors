'use client'

import { useEffect, useRef, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import ProjectsSubmit from './ProjectsSubmit'
import { useGetAssociatedProjects } from '../hooks/useGetAssociatedProjects'
import { RelatedProjectsType } from '../interfaces'

import { Redirect, useParams } from 'wouter'
import { debounce, isNull } from 'lodash'

const ProjectsSubmitWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()
  const isFirstRender = useRef(false)

  const [associatedProjects, setAssociatedProjects] = useState<
    RelatedProjectsType[] | null
  >([])
  const [loaded, setLoaded] = useState<boolean>(false)

  const debouncedGetAssociatedProjects = debounce(() => {
    useGetAssociatedProjects(
      parseInt(project_id),
      setAssociatedProjects,
      setLoaded,
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
        <ProjectsSubmit
          {...{ associatedProjects, loaded, setLoaded, setAssociatedProjects }}
        />
      )}
    </>
  )
}

export default ProjectsSubmitWrapper
