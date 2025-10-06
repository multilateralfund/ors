import { SectionTitle } from '../ProjectsCreate/ProjectsCreate'
import { NavigationButton, RelatedProjects } from '../HelperComponents'
import {
  ProjectTabSetters,
  RelatedProjectsSectionType,
} from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'

import { Divider, CircularProgress } from '@mui/material'
import { map } from 'lodash'

const ProjectRelatedProjects = ({
  relatedProjects,
  setCurrentTab,
}: ProjectTabSetters & {
  relatedProjects?: RelatedProjectsSectionType[]
}) => (
  <>
    <div className="flex w-full flex-col">
      {map(relatedProjects, ({ data, title, noResultsText }, index) => {
        const { projects: crtData = [], loaded } = data

        return (
          <span key={index}>
            {index !== 0 && <Divider className="mb-4 mt-3" />}
            <SectionTitle>{title}</SectionTitle>
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
      })}
    </div>
    {setCurrentTab && (
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <NavigationButton type="previous" setCurrentTab={setCurrentTab} />
        <NavigationButton {...{ setCurrentTab }} />
      </div>
    )}
  </>
)

export default ProjectRelatedProjects
