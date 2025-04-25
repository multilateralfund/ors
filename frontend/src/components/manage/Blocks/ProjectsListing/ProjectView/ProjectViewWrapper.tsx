'use client'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import ProjectView from './ProjectView'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import { useGetProject } from '../hooks/useGetProject'

import { useParams } from 'wouter'

const ProjectViewWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()

  const project = useGetProject(project_id)
  const { data, loading } = project

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && (
        <>
          <HeaderTitle>
            <PageHeading className="min-w-fit">{data.code}</PageHeading>
          </HeaderTitle>
          <ProjectView {...{ project }} />
        </>
      )}
    </>
  )
}

export default ProjectViewWrapper
