'use client'

import { useEffect, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ProjectView from './ProjectView'
import {
  VersionsDropdown,
  HeaderTag,
} from '../ProjectVersions/ProjectVersionsComponents'
import { useGetProject } from '../hooks/useGetProject'
import { useGetProjectFiles } from '../hooks/useGetProjectFiles'
import { fetchSpecificFields } from '../hooks/getSpecificFields'
import { ProjectSpecificFields } from '../interfaces'
import { getTitleExtras } from '../utils'
import { useStore } from '@ors/store'

import { lowerCase } from 'lodash'
import { useParams } from 'wouter'

const ProjectViewWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()

  const projectSlice = useStore((state) => state.projects)
  const user_permissions = projectSlice.user_permissions.data || []

  const project = useGetProject(project_id)
  const { data, loading } = project
  const { cluster_id, project_type_id, sector_id } = data || {}

  const { data: projectFiles } = useGetProjectFiles(project_id)

  const [specificFields, setSpecificFields] = useState<ProjectSpecificFields[]>(
    [],
  )
  const [showVersionsMenu, setShowVersionsMenu] = useState<boolean>(false)

  const { title, versions, version, latest_project, submission_status } =
    data || {}

  useEffect(() => {
    if (cluster_id && project_type_id && sector_id) {
      fetchSpecificFields(
        cluster_id,
        project_type_id,
        sector_id,
        setSpecificFields,
      )
    } else setSpecificFields([])
  }, [cluster_id, project_type_id, sector_id])

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
              <div className="flex gap-2">
                <PageHeading className="min-w-fit">
                  Project: {title ?? 'N/A'}
                  {getTitleExtras(data)}
                </PageHeading>
                {(version > 1 || lowerCase(submission_status) !== 'draft') && (
                  <>
                    <VersionsDropdown
                      {...{ versions, showVersionsMenu, setShowVersionsMenu }}
                    />
                    <HeaderTag {...{ latest_project, version }} />
                  </>
                )}
              </div>
              {user_permissions.includes('edit_project') && (
                <CustomLink
                  className="mb-4 h-10 text-nowrap px-4 py-2 text-lg uppercase"
                  href={`/projects-listing/${project_id}/edit`}
                  color="secondary"
                  variant="contained"
                  button
                >
                  Edit
                </CustomLink>
              )}
            </div>
          </HeaderTitle>
          <ProjectView project={data} {...{ projectFiles, specificFields }} />
        </>
      )}
    </>
  )
}

export default ProjectViewWrapper
