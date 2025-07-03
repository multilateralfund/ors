import ProjectOverview from './ProjectOverview'
import ProjectSubstanceDetails from './ProjectSubstanceDetails'
import { SectionTitle } from './ProjectsCreate'
import {
  ProjectDataProps,
  ProjectSpecificFields,
  TrancheErrors,
} from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'

import { Divider } from '@mui/material'

const ProjectSpecificInfoSection = ({
  overviewFields,
  substanceDetailsFields,
  overviewErrors,
  substanceDetailsErrors,
  odsOdpErrors,
  trancheErrors,
  getTrancheErrors,
  ...rest
}: ProjectDataProps &
  TrancheErrors & {
    overviewFields: ProjectSpecificFields[]
    substanceDetailsFields: ProjectSpecificFields[]
    overviewErrors?: { [key: string]: string[] }
    substanceDetailsErrors?: { [key: string]: string[] }
    odsOdpErrors: { [key: string]: [] }[]
  }) => {
  return (
    <>
      {overviewFields.length > 0 && (
        <>
          <SectionTitle>Overview</SectionTitle>
          <ProjectOverview
            sectionFields={overviewFields}
            errors={overviewErrors}
            trancheErrors={trancheErrors}
            getTrancheErrors={getTrancheErrors}
            {...rest}
          />
        </>
      )}

      {overviewFields.length > 0 && substanceDetailsFields.length > 0 && (
        <Divider className="my-6" />
      )}

      {substanceDetailsFields.length > 0 && (
        <>
          <SectionTitle>Substance Details</SectionTitle>
          <ProjectSubstanceDetails
            sectionFields={substanceDetailsFields}
            errors={substanceDetailsErrors}
            odsOdpErrors={odsOdpErrors}
            {...rest}
          />
        </>
      )}
    </>
  )
}

export default ProjectSpecificInfoSection
