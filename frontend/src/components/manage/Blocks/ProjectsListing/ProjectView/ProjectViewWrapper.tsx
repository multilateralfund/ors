'use client'

import { useContext, useEffect, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
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

import { Redirect, useLocation, useParams } from 'wouter'
import { isNull } from 'lodash'

const EditLink = (props: any) => {
  const { children, ...rest } = props
  return (
    <CustomLink
      className={'ml-auto mt-auto h-10 text-nowrap text-lg uppercase'}
      color="secondary"
      variant="contained"
      {...rest}
      button
    >
      {children}
    </CustomLink>
  )
}

const ProjectViewWrapper = () => {
  const { project_id, version: paramsVersion } =
    useParams<Record<string, string>>()
  const [location] = useLocation()

  const { canEditProjects, canEditApprovedProjects } =
    useContext(PermissionsContext)

  const project = useGetProject(project_id)
  const { data, loading } = project
  const {
    cluster_id,
    project_type_id,
    sector_id,
    submission_status,
    status: project_status,
    latest_project,
    version,
    editable,
  } = data || {}

  const { files: projectFiles, loadedFiles } = useGetProjectFiles(
    parseInt(project_id),
  )

  const [specificFields, setSpecificFields] = useState<ProjectSpecificFields[]>(
    [],
  )
  const [specificFieldsLoaded, setSpecificFieldsLoaded] =
    useState<boolean>(false)
  const [showVersionsMenu, setShowVersionsMenu] = useState<boolean>(false)

  useEffect(() => {
    setSpecificFieldsLoaded(false)

    if (cluster_id && project_type_id && sector_id) {
      fetchSpecificFields(
        cluster_id,
        project_type_id,
        sector_id,
        setSpecificFields,
        project_id,
        setSpecificFieldsLoaded,
      )
    } else {
      setSpecificFields([])
      setSpecificFieldsLoaded(true)
    }
  }, [cluster_id, project_type_id, sector_id])

  if (project?.error) {
    return <Redirect to="/projects-listing/listing" />
  }

  if (
    data &&
    latest_project &&
    (!location.includes('archive') || paramsVersion != version)
  ) {
    return (
      <Redirect to={`/projects-listing/${project_id}/archive/${version}`} />
    )
  }

  if (data && !latest_project && location.includes('archive')) {
    return <Redirect to={`/projects-listing/${project_id}`} />
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
            <div className="flex flex-wrap justify-between gap-3">
              <div className="flex flex-col">
                <RedirectBackButton />
                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <PageHeading>
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
              <div className="flex gap-3">
                {canEditProjects &&
                  editable &&
                  isNull(latest_project) &&
                  (!['Withdrawn', 'Not approved'].includes(submission_status) ||
                    canEditApprovedProjects) && (
                    <EditLink href={`/projects-listing/${project_id}/edit`}>
                      Edit
                    </EditLink>
                  )}
                {canEditProjects &&
                submission_status === 'Approved' &&
                project_status !== 'Completed' ? (
                  <EditLink
                    href={`/projects-listing/${project_id}/post-excom-update`}
                  >
                    Update post ExCom
                  </EditLink>
                ) : null}
              </div>
            </div>
            <ProjectStatusInfo project={data} />
          </HeaderTitle>
          <ProjectView
            project={data}
            {...{
              projectFiles,
              specificFields,
              specificFieldsLoaded,
              loadedFiles,
            }}
          />
        </>
      )}
    </>
  )
}

export default ProjectViewWrapper
