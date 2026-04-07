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
import { useStore } from '@ors/store'

import { Divider, CircularProgress } from '@mui/material'
import { isNull, map, orderBy, uniqBy } from 'lodash'
import { TbLayersSubtract } from 'react-icons/tb'
import { IoGridOutline } from 'react-icons/io5'

const ProjectRelatedProjects = ({
  project,
  relatedProjects,
  metaProjectId,
  setMetaProjectId,
  setRefetchRelatedProjects,
  canDisassociate,
  metaprojectData,
  mode,
  isMya,
}: {
  project?: ProjectTypeApi
  relatedProjects: RelatedProjectsSectionType[]
  metaProjectId?: number | null
  setMetaProjectId?: (id: number | null) => void
  setRefetchRelatedProjects?: (refetch: boolean) => void
  canDisassociate?: boolean
  metaprojectData: MetaProjectDetailType | null
  mode: string
  isMya: boolean
}) => {
  const { canDisassociateProjects, canDisassociateComponents } =
    useContext(PermissionsContext)

  const { loadingMpData } = useStore((state) => state.mpData)

  const isVieworEditMode = ['edit', 'view'].includes(mode) && !!project
  const isAddOrCopyMode = ['add', 'copy'].includes(mode)
  const isExistingMetaproject = !!metaprojectData && !metaprojectData.is_draft

  const canRemoveAssociation =
    isVieworEditMode &&
    canDisassociateProjects &&
    (project.editable || canDisassociate) &&
    project.submission_status === 'Approved' &&
    isExistingMetaproject &&
    !!metaProjectId

  const canDisassociateComponent =
    isVieworEditMode &&
    canDisassociateComponents &&
    isExistingMetaproject &&
    isNull(project.latest_project) &&
    project.submission_status === 'Submitted'

  const hasComponents =
    isVieworEditMode &&
    project.component &&
    project.component.original_project_id === project.id

  const getHasPossibleAssociatedProjects = (type: string) => {
    const commonSubmissionStatuses = ['Withdrawn', 'Not approved']
    const submissionStatuses =
      type === 'message'
        ? [...commonSubmissionStatuses, 'Approved']
        : commonSubmissionStatuses

    return (
      isMya &&
      !(
        isVieworEditMode &&
        submissionStatuses.includes(project.submission_status)
      )
    )
  }

  const RelatedProjectsList = () =>
    map(
      relatedProjects,
      ({ data, title, noResultsText, downloadButton }, index) => {
        if (isAddOrCopyMode && index === 0) {
          return
        }

        const { projects: crtData = [], loaded } = data

        const loadedProjects = index === 0 ? loaded : loaded && !loadingMpData
        const showDownloadButton =
          crtData && crtData.length > 0 && downloadButton && loadedProjects
        const isLinkMode = mode.includes('link') && !!project

        const getFinalData = () => {
          if (index === 0) {
            return isLinkMode
              ? [{ ...project, errors: [], warnings: [] }]
              : (crtData ?? [])
          }

          const allMetaprojectProjects = [
            ...(metaprojectData?.projects ?? []),
            ...(metaprojectData?.possible_projects ?? []),
          ]

          const allCrtData = getHasPossibleAssociatedProjects('data')
            ? [
                ...(crtData ?? []),
                ...map(allMetaprojectProjects, (project) => ({
                  ...project,
                  errors: [],
                  warnings: [],
                })),
              ]
            : (crtData ?? [])

          const componentsIds = map(relatedProjects[0].data.projects, 'id')
          const filteredData = allCrtData.filter(
            (entry) =>
              !componentsIds.includes(entry.id) &&
              !(isVieworEditMode && entry.id === project.id) &&
              !(isLinkMode && entry.id === project.id),
          )
          const orderedData = orderBy(
            filteredData,
            [(entry) => entry.submission_status === 'Approved'],
            ['desc'],
          )
          return uniqBy(orderedData, 'id')
        }

        const finalData = getFinalData()

        return (
          <span key={index} className="rounded-lg bg-common-containerBg p-6">
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
            {loadedProjects ? (
              finalData && finalData.length > 0 ? (
                <>
                  <RelatedProjects
                    data={finalData as RelatedProjectsType[]}
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
    <div className="flex w-full flex-col">
      {isVieworEditMode && !!metaprojectData?.id && (
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
        {getHasPossibleAssociatedProjects('message') && (
          <div className="text-xl">
            Should this project get approved, it will have the following
            {!isAddOrCopyMode ? ' components and' : ''} associated projects:
          </div>
        )}
        <RelatedProjectsList />
      </div>
    </div>
  )
}

export default ProjectRelatedProjects
