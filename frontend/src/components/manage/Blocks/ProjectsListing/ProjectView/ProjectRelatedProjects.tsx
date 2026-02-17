import { useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectRelatedProjectsMetaProject from './ProjectRelatedProjectsMetaProject'
import ProjectDisassociate from '../ProjectsCreate/ProjectDisassociate'
import RemoveAssociation from './RemoveAssociation'
import { SectionTitle } from '../ProjectsCreate/ProjectsCreate'
import { NavigationButton, RelatedProjects } from '../HelperComponents'
import { MetaProjectDetailType } from '../UpdateMyaData/types'
import {
  ProjectTabSetters,
  ProjectTypeApi,
  RelatedProjectsSectionType,
} from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'

import { Divider, CircularProgress } from '@mui/material'
import { TbLayersSubtract } from 'react-icons/tb'
import { IoGridOutline } from 'react-icons/io5'
import { isNull, map } from 'lodash'

const ProjectRelatedProjects = ({
  project,
  relatedProjects,
  setCurrentTab,
  metaProjectId,
  setMetaProjectId,
  setRefetchRelatedProjects,
  canDisassociate,
  metaprojectData,
}: ProjectTabSetters & {
  project: ProjectTypeApi
  relatedProjects?: RelatedProjectsSectionType[]
  metaProjectId?: number | null
  setMetaProjectId?: (id: number | null) => void
  setRefetchRelatedProjects?: (refetch: boolean) => void
  canDisassociate?: boolean
  metaprojectData?: MetaProjectDetailType | null
}) => {
  const {
    canDisassociateProjects,
    canDisassociateComponents,
    canViewMetaProjects,
  } = useContext(PermissionsContext)

  const hasMetaProject = !!project.meta_project_id

  const canRemoveAssociation =
    canDisassociateProjects &&
    (project.editable || canDisassociate) &&
    !!metaProjectId

  const canDisassociateComponent =
    canDisassociateComponents &&
    isNull(project.latest_project) &&
    project.submission_status === 'Submitted'

  const hasComponents =
    project.component && project.component.original_project_id === project.id

  const RelatedProjectsList = () =>
    map(
      relatedProjects,
      ({ data, title, noResultsText, downloadButton }, index) => {
        const { projects: crtData = [], loaded } = data
        const showDownloadButton =
          crtData && crtData.length > 0 && downloadButton

        return (
          <span key={index} className="rounded-lg bg-[#F5F5F5] p-6">
            <div className="flex flex-wrap items-center gap-2.5">
              {index === 0 ? (
                <IoGridOutline className="mb-4 rotate-45" size={16} />
              ) : (
                <TbLayersSubtract className="mb-4" size={22} />
              )}
              <div className="flex-1">
                {showDownloadButton ? (
                  <SectionTitle>
                    <span className="flex flex-wrap items-center justify-between">
                      {title} {downloadButton}
                    </span>
                  </SectionTitle>
                ) : (
                  <SectionTitle>{title}</SectionTitle>
                )}
              </div>
            </div>
            {loaded ? (
              crtData && crtData.length > 0 ? (
                <>
                  <RelatedProjects
                    data={crtData}
                    isLoaded={true}
                    withExtraProjectInfo={true}
                    canRefreshStatus={false}
                    mode="view"
                  />
                  {index === 0 && canDisassociateComponent && (
                    <ProjectDisassociate
                      {...{
                        project,
                        setRefetchRelatedProjects,
                        hasComponents,
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="mb-3 text-lg italic">{noResultsText}</div>
              )
            ) : (
              <CircularProgress
                color="inherit"
                size="24px"
                className="ml-1.5"
              />
            )}
          </span>
        )
      },
    )

  return (
    <>
      <div className="flex w-full flex-col">
        {hasMetaProject && (
          <>
            <SectionTitle>
              <div className="flex flex-wrap items-center gap-2">
                <span>Umbrella metacode:</span>
                <h4 className="m-0 text-2xl normal-case leading-none text-primary">
                  {project.umbrella_code}
                </h4>
              </div>
            </SectionTitle>
            {canRemoveAssociation && (
              <div className="mb-3 text-lg">
                If you want this project to be removed from the umbrella
                metacode, click
                <RemoveAssociation {...{ setMetaProjectId }} />
                (In case of removal, the component relationships will be
                maintained.)
              </div>
            )}
            <Divider className="mb-6" />
          </>
        )}
        {hasMetaProject && canViewMetaProjects ? (
          <div className="flex w-full flex-wrap gap-4">
            <div className="flex flex-col gap-y-4 xl:w-auto xl:basis-[55%]">
              <RelatedProjectsList />
            </div>
            <span className="rounded-lg bg-[#F5F5F5] p-6 xl:flex-1">
              <ProjectRelatedProjectsMetaProject {...{ metaprojectData }} />
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-y-4">
            <RelatedProjectsList />
          </div>
        )}
      </div>
      {setCurrentTab && (
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <NavigationButton type="previous" setCurrentTab={setCurrentTab} />
          <NavigationButton {...{ setCurrentTab }} />
        </div>
      )}
    </>
  )
}

export default ProjectRelatedProjects
