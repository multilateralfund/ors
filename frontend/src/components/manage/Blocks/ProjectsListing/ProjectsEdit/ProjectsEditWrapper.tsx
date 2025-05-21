'use client'

import Loading from '@ors/components/theme/Loading/Loading'
import ProjectsEdit from './ProjectsEdit'
import { useGetProject } from '../hooks/useGetProject'

import { useParams } from 'wouter'

const ProjectsEditWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()

  const project = useGetProject(project_id)
  const { data, loading } = project

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && <ProjectsEdit project={data} />}
    </>
  )
}

export default ProjectsEditWrapper
