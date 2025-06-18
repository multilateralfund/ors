'use client'

import Loading from '@ors/components/theme/Loading/Loading'
import ProjectsAssociate from './ProjectsAssociate'
import { useGetProject } from '../hooks/useGetProject'

import { useParams } from 'wouter'

const ProjectsAssociateWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()

  const project = useGetProject(project_id)
  const { data, loading } = project

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && <ProjectsAssociate project={data} />}
    </>
  )
}

export default ProjectsAssociateWrapper
