import { RelatedProjectsSectionType } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import { SectionTitle } from '../ProjectsCreate/ProjectsCreate'
import { RelatedProjects } from '../HelperComponents'

import { Divider } from '@mui/material'
import { map } from 'lodash'

const ProjectRelatedProjects = ({
  relatedProjects,
}: {
  relatedProjects?: RelatedProjectsSectionType[]
}) => (
  <div className="flex w-full flex-col">
    {map(relatedProjects, ({ data, title }, index) => (
      <>
        {index !== 0 &&
          relatedProjects?.every(
            (project) => (project?.data?.length ?? 0) > 0,
          ) && <Divider className="mb-4 mt-3" />}
        <SectionTitle>{title}</SectionTitle>
        {data && data.length > 0 ? (
          <RelatedProjects
            data={data}
            isLoaded={true}
            withDividers={false}
            canRefreshStatus={false}
            mode="view"
          />
        ) : (
          <div className="mb-3">-</div>
        )}
      </>
    ))}
  </div>
)

export default ProjectRelatedProjects
