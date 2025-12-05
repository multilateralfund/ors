'use client'

import { useEffect, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ProjectViewButtons from '../ProjectsListing/ProjectViewButtons'
import ProjectView from './ProjectView'
import {
  PageTitle,
  ProjectStatusInfo,
  RedirectBackButton,
  VersionsList,
} from '../HelperComponents'
import { useGetProjectFiles } from '../hooks/useGetProjectFiles'
import { fetchSpecificFields } from '../hooks/getSpecificFields'
import { useGetProject } from '../hooks/useGetProject'
import { ProjectSpecificFields } from '../interfaces'

import { Redirect, useLocation, useParams } from 'wouter'

const ProjectViewWrapper = () => {
  const { project_id, version: paramsVersion } =
    useParams<Record<string, string>>()
  const [location] = useLocation()

  const project = useGetProject(project_id)
  const { data, loading } = project
  const { cluster_id, project_type_id, sector_id, latest_project, version } =
    data || {}

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
              <ProjectViewButtons
                {...{ data, specificFields }}
                setParams={project.setParams}
              />
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
