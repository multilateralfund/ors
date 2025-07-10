'use client'

import Loading from '@ors/components/theme/Loading/Loading'
import ProjectsEdit from './ProjectsEdit'
import { useGetProject } from '../hooks/useGetProject'

import { Redirect, useParams } from 'wouter'
import { isNull } from 'lodash'

const ProjectsEditWrapper = ({ mode }: { mode: string }) => {
  const { project_id } = useParams<Record<string, string>>()

  const project = useGetProject(project_id)
  const { data, loading } = project

  if (project?.error) {
    return <Redirect to="/projects-listing" />
  }

  if (
    data &&
    ((mode !== 'copy' && data.submission_status === 'Withdrawn') ||
      !isNull(data?.latest_project))
  ) {
    return <Redirect to={`/projects-listing/${project_id}`} />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && <ProjectsEdit project={data} mode={mode} />}
    </>
  )
}

export default ProjectsEditWrapper
