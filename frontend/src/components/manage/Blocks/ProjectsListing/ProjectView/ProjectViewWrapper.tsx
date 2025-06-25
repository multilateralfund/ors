'use client'

import { useContext, useEffect, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ProjectView from './ProjectView'
import { PageTitle, RedirectBackButton } from '../HelperComponents'
import {
  VersionsDropdown,
  HeaderTag,
} from '../ProjectVersions/ProjectVersionsComponents'
import { useGetProject } from '../hooks/useGetProject'
import { useGetProjectFiles } from '../hooks/useGetProjectFiles'
import { fetchSpecificFields } from '../hooks/getSpecificFields'
import { ProjectSpecificFields } from '../interfaces'

import { lowerCase } from 'lodash'
import { useParams } from 'wouter'
import PermissionsContext from '@ors/contexts/PermissionsContext'

const ProjectViewWrapper = () => {
  const { project_id } = useParams<Record<string, string>>()

  const project = useGetProject(project_id)
  const { data, loading } = project
  const {
    cluster_id,
    project_type_id,
    sector_id,
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

  const { canUpdateProjects, canSubmitProjects, canRecommendProjects } =
    useContext(PermissionsContext)

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
                    <PageTitle pageTitle="View project" project={data} />
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
              {(canUpdateProjects ||
                canSubmitProjects ||
                canRecommendProjects) &&
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
