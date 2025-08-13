import { RelatedProjectsSectionType } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import { SectionTitle } from '../ProjectsCreate/ProjectsCreate'
import { RelatedProjects } from '../HelperComponents'

import { Divider, CircularProgress } from '@mui/material'
import { map } from 'lodash'

const ProjectRelatedProjects = ({
  relatedProjects,
}: {
  relatedProjects?: RelatedProjectsSectionType[]
}) => (
  <div className="flex w-full flex-col">
    {map(relatedProjects, ({ data, title, loaded, noResultsText }, index) => (
      <>
        {index !== 0 && <Divider className="mb-4 mt-3" />}
        <SectionTitle>{title}</SectionTitle>
        {loaded ? (
          data && data.length > 0 ? (
            <RelatedProjects
              data={data}
              isLoaded={true}
              withExtraProjectInfo={true}
              canRefreshStatus={false}
              mode="view"
            />
          ) : (
            <div className="mb-3 text-lg italic">{noResultsText}</div>
          )
        ) : (
          <CircularProgress color="inherit" size="24px" className="ml-1.5" />
        )}
      </>
    ))}
  </div>
)

export default ProjectRelatedProjects
