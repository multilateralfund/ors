'use client'

import { useEffect, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ProjectView from './ProjectView'
import { RedirectBackButton } from '../HelperComponents'
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

  const commonSlice = useStore((state) => state.common)
  const user_permissions = commonSlice.user_permissions.data || []

  const project = useGetProject(project_id)
  const { data, loading } = project
  const {
    cluster_id,
    project_type_id,
    sector_id,
    title,
    versions,
    version,
    latest_project,
    submission_status,
    status,
  } = data || {}

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
              <div className="flex flex-col">
                <RedirectBackButton />
                <div className="flex gap-2">
                  <PageHeading className="min-w-fit">
                    <div className="flex gap-2.5">
                      <span className="font-medium text-[#4D4D4D]">
                        View project:
                      </span>
                      <div>
                        {title ?? 'New project'}
                        {getTitleExtras(data)}
                      </div>
                    </div>
                  </PageHeading>
                  {(version > 1 ||
                    lowerCase(submission_status) !== 'draft') && (
                    <>
                      <VersionsDropdown
                        {...{ versions, showVersionsMenu, setShowVersionsMenu }}
                      />
                      <HeaderTag {...{ latest_project, version }} />
                    </>
                  )}
                </div>
              </div>
              {user_permissions.includes('edit_project') &&
                lowerCase(submission_status) !== 'withdrawn' && (
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
            <div className="mt-4 flex gap-3">
              <div className="flex items-center gap-3">
                <span>Submission status:</span>
                <span className="rounded border border-solid border-[#002A3C] p-1 font-medium uppercase leading-none text-[#002A3C]">
                  {submission_status}
                </span>
              </div>

              <span>|</span>

              <div className="flex items-center gap-3">
                <span>Project status:</span>
                <span className="rounded border border-solid border-[#002A3C] p-1 font-medium uppercase leading-none text-[#002A3C]">
                  {status}
                </span>
              </div>
            </div>
          </HeaderTitle>
          <ProjectView project={data} {...{ projectFiles, specificFields }} />
        </>
      )}
    </>
  )
}

export default ProjectViewWrapper
