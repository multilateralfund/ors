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
import { useStore } from '@ors/store'

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
  const [fieldsLoading, setFieldsLoading] = useState<boolean>(true)
  const [showVersionsMenu, setShowVersionsMenu] = useState<boolean>(false)

  const { code, versions, version, latest_project } = data || {}

  useEffect(() => {
    if (cluster_id && project_type_id && sector_id) {
      fetchSpecificFields(
        cluster_id,
        project_type_id,
        sector_id,
        setSpecificFields,
        setFieldsLoading,
      )
    } else setSpecificFields([])
  }, [cluster_id, project_type_id, sector_id])

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading || fieldsLoading}
      />
      {!loading && !fieldsLoading && data && (
        <>
          <HeaderTitle>
            <div className="align-center flex justify-between">
              <div className="flex gap-2">
                <PageHeading className="min-w-fit">{code}</PageHeading>
                <VersionsDropdown
                  {...{ versions, showVersionsMenu, setShowVersionsMenu }}
                />
                <HeaderTag {...{ latest_project, version }} />
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
