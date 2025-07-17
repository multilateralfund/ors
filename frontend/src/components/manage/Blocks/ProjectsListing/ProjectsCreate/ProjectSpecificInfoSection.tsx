import {
  ProjectDataProps,
  ProjectSpecificFields,
  TrancheErrors,
} from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import ProjectOverview from './ProjectOverview'
import ProjectSubstanceDetails from './ProjectSubstanceDetails'
import { SectionTitle } from './ProjectsCreate'
import { hasFields } from '../utils'
import { useStore } from '@ors/store'

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
  const { projectFields, viewableFields } = useStore(
    (state) => state.projectFields,
  )

  const canViewOverviewSection =
    overviewFields.length > 0 &&
    hasFields(projectFields, viewableFields, 'Header')
  const canViewSubstanceDetailsSection =
    substanceDetailsFields.length > 0 &&
    hasFields(projectFields, viewableFields, 'Substance Details')

  return (
    <>
      {canViewOverviewSection && (
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

      {canViewOverviewSection && canViewSubstanceDetailsSection && (
        <Divider className="my-6" />
      )}

      {canViewSubstanceDetailsSection && (
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
