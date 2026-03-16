import { useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import ProjectDisassociate from '../ProjectsCreate/ProjectDisassociate'
import RemoveAssociation from './RemoveAssociation'
import { SectionTitle } from '../ProjectsCreate/ProjectsCreate'
import { RelatedProjects } from '../HelperComponents'
import {
  ProjectTypeApi,
  RelatedProjectsSectionType,
  RelatedProjectsType,
} from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import { MetaProjectDetailType } from '../UpdateMyaData/types'

import { Divider, CircularProgress } from '@mui/material'
import { TbLayersSubtract } from 'react-icons/tb'
import { IoGridOutline } from 'react-icons/io5'
import { isNull, map, orderBy, uniqBy } from 'lodash'

const ProjectRelatedProjects = ({
  project,
  relatedProjects,
  metaProjectId,
  setMetaProjectId,
  setRefetchRelatedProjects,
  canDisassociate,
  mode,
  isMya,
  metaprojectData,
}: {
  project?: ProjectTypeApi
  relatedProjects: RelatedProjectsSectionType[]
  metaProjectId?: number | null
  setMetaProjectId?: (id: number | null) => void
  setRefetchRelatedProjects?: (refetch: boolean) => void
  canDisassociate?: boolean
  mode: string
  isMya: boolean
  metaprojectData?: MetaProjectDetailType | null
}) => {
  const isVieworEditMode = ['edit', 'view'].includes(mode) && !!project

  const { canDisassociateProjects, canDisassociateComponents } =
    useContext(PermissionsContext)

  const hasMetaProject = isVieworEditMode && !!project.meta_project_id

  const canRemoveAssociation =
    isVieworEditMode &&
    canDisassociateProjects &&
    (project.editable || canDisassociate) &&
    !!metaProjectId

  const canDisassociateComponent =
    isVieworEditMode &&
    canDisassociateComponents &&
    isNull(project.latest_project) &&
    project.submission_status === 'Submitted'

  const hasComponents =
    isVieworEditMode &&
    project.component &&
    project.component.original_project_id === project.id

  const hasPossibleAssociatedProjects =
    isMya &&
    (!isVieworEditMode ||
      (project.version < 3 && project.submission_status !== 'Withdrawn'))

  const RelatedProjectsList = () =>
    map(
      relatedProjects,
      ({ data, title, noResultsText, downloadButton }, index) => {
        const { projects: crtData = [], loaded } = data
        const showDownloadButton =
          crtData && crtData.length > 0 && downloadButton

        const formattedCrtData =
          index === 1 && hasPossibleAssociatedProjects
            ? [
                ...(crtData ?? []),
                ...(metaprojectData?.possible_projects ?? []).map(
                  (project) => ({
                    ...project,
                    errors: [],
                    warnings: [],
                  }),
                ),
              ]
            : crtData

        const sortedCrtData = uniqBy(
          orderBy(
            formattedCrtData,
            [(p) => p.submission_status === 'Approved'],
            ['desc'],
          ).filter(
            (p) =>
              p.submission_status !== 'Draft' &&
              (!isVieworEditMode || p.id !== project.id),
          ),
          'id',
        )

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
              sortedCrtData && sortedCrtData.length > 0 ? (
                <>
                  <RelatedProjects
                    data={sortedCrtData as RelatedProjectsType[]}
                    isLoaded={true}
                    withExtraProjectInfo={true}
                    canRefreshStatus={false}
                    mode="view"
                    displaySubmissionStatus={true}
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
    <div className="flex w-full flex-col">
      {isVieworEditMode && hasMetaProject && (
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
              If you want this project to be removed from the umbrella metacode,
              click
              <RemoveAssociation {...{ setMetaProjectId }} />
              (In case of removal, the component relationships will be
              maintained.)
            </div>
          )}
          <Divider className="mb-6" />
        </>
      )}
      <div className="flex flex-col gap-y-4">
        {hasPossibleAssociatedProjects && (
          <div className="text-xl">
            Should this project get approved, it will have the following
            components and associated projects:
          </div>
        )}
        <RelatedProjectsList />
      </div>
    </div>
  )
}

export default ProjectRelatedProjects
