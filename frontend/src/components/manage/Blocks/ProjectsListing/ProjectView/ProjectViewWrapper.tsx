'use client'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import ProjectView from './ProjectView'
import CustomLink from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import { useGetProject } from '../hooks/useGetProject'
import { useGetProjectFiles } from '../hooks/useGetProjectFiles'

import { useParams } from 'wouter'

const ProjectViewWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()

  const project = useGetProject(project_id)
  const { data, loading } = project

  const { data: projectFiles } = useGetProjectFiles(project_id) as any

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && (
        <>
          <HeaderTitle>
            <div className="align-center flex justify-between">
              <PageHeading className="min-w-fit">{data.code}</PageHeading>
              <CustomLink
                className="mb-4 h-10 text-nowrap px-4 py-2 text-lg uppercase"
                href={`/projects-listing/${project_id}/edit`}
                color="secondary"
                variant="contained"
                button
              >
                Edit
              </CustomLink>
            </div>
          </HeaderTitle>
          <ProjectView {...{ project, projectFiles }} />
        </>
      )}
    </>
  )
}

export default ProjectViewWrapper
