'use client'

import { useContext, useEffect, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import NotFound from '@ors/components/theme/Views/NotFound'
import CustomLink from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectView from './ProjectView'
import {
  PageTitle,
  ProjectStatusInfo,
  RedirectBackButton,
  VersionsList,
} from '../HelperComponents'
import { useGetProject } from '../hooks/useGetProject'
import { useGetProjectFiles } from '../hooks/useGetProjectFiles'
import { fetchSpecificFields } from '../hooks/getSpecificFields'
import { ProjectSpecificFields } from '../interfaces'

import { lowerCase } from 'lodash'
import { useParams } from 'wouter'

const ProjectViewWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()

  const { canEditProjects } = useContext(PermissionsContext)

  const project = useGetProject(project_id)
  const { data, loading } = project
  const { cluster_id, project_type_id, sector_id, submission_status } =
    data || {}

  const { data: projectFiles } = useGetProjectFiles(project_id)

  const [specificFields, setSpecificFields] = useState<ProjectSpecificFields[]>(
    [],
  )
  const [showVersionsMenu, setShowVersionsMenu] = useState<boolean>(false)

  useEffect(() => {
    if (cluster_id && project_type_id && sector_id) {
      fetchSpecificFields(
        cluster_id,
        project_type_id,
        sector_id,
        setSpecificFields,
        project_id,
      )
    } else setSpecificFields([])
  }, [cluster_id, project_type_id, sector_id])

  if (project?.error) {
    return <NotFound />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && (
        <>
          <HeaderTitle>
            <div className="align-center flex flex-wrap justify-between gap-3">
              <div className="flex flex-col">
                <RedirectBackButton />
                <div className="flex gap-2">
                  <PageHeading className="min-w-fit">
                    <PageTitle
                      pageTitle="View project"
                      projectTitle={data.title}
                      project={data}
                    />
                  </PageHeading>
                  {project && (
                    <VersionsList
                      project={data}
                      {...{ showVersionsMenu, setShowVersionsMenu }}
                    />
                  )}
                </div>
              </div>
              {canEditProjects &&
                lowerCase(submission_status) !== 'withdrawn' && (
                  <CustomLink
                    className="mb-4 ml-auto h-10 text-nowrap px-4 py-2 text-lg uppercase"
                    href={`/projects-listing/${project_id}/edit`}
                    color="secondary"
                    variant="contained"
                    button
                  >
                    Edit
                  </CustomLink>
                )}
            </div>
            <ProjectStatusInfo project={data} />
          </HeaderTitle>
          <ProjectView project={data} {...{ projectFiles, specificFields }} />
        </>
      )}
    </>
  )
}

export default ProjectViewWrapper
