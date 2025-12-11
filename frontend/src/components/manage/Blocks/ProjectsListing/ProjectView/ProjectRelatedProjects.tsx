import { useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import { SectionTitle } from '../ProjectsCreate/ProjectsCreate'
import RemoveAssociation from './RemoveAssociation'
import { NavigationButton, RelatedProjects } from '../HelperComponents'
import {
  ProjectTabSetters,
  ProjectTypeApi,
  RelatedProjectsSectionType,
} from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'

import { Divider, CircularProgress } from '@mui/material'
import { map } from 'lodash'

const ProjectRelatedProjects = ({
  project,
  relatedProjects,
  setCurrentTab,
  metaProjectId,
  setMetaProjectId,
  canDisassociate,
}: ProjectTabSetters & {
  project: ProjectTypeApi
  relatedProjects?: RelatedProjectsSectionType[]
  metaProjectId?: number | null
  setMetaProjectId?: (id: number | null) => void
  canDisassociate?: boolean
}) => {
  const { canDisassociateProjects } = useContext(PermissionsContext)
  const canRemoveAssociation =
    canDisassociateProjects &&
    (project.editable || canDisassociate) &&
    !!project.meta_project_id &&
    !!metaProjectId

  return (
    <>
      <div className="flex w-full flex-col">
        {canRemoveAssociation && (
          <>
            <SectionTitle>
              <div className="flex flex-wrap items-center gap-2">
                <span>Umbrella metacode:</span>
                <h4 className="m-0 normal-case"> {project.umbrella_code}</h4>
              </div>
            </SectionTitle>
            <div className="text-lg">
              If you want this project to be removed from the umbrella metacode,
              click
              <RemoveAssociation {...{ setMetaProjectId }} />
              (In case of removal, the component relationships will be
              maintained.)
            </div>
            <Divider className="mb-4 mt-3" />
          </>
        )}

        {map(
          relatedProjects,
          ({ data, title, noResultsText, downloadButton }, index) => {
            const { projects: crtData = [], loaded } = data
            const showDownloadButton =
              crtData && crtData.length > 0 && downloadButton

            return (
              <span key={index}>
                {index !== 0 && <Divider className="mb-4 mt-3" />}
                {showDownloadButton ? (
                  <SectionTitle>
                    <span className="flex items-center justify-between">
                      {title} {downloadButton}
                    </span>
                  </SectionTitle>
                ) : (
                  <SectionTitle>{title}</SectionTitle>
                )}
                {loaded ? (
                  crtData && crtData.length > 0 ? (
                    <RelatedProjects
                      data={crtData}
                      isLoaded={true}
                      withExtraProjectInfo={true}
                      canRefreshStatus={false}
                      mode="view"
                    />
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
