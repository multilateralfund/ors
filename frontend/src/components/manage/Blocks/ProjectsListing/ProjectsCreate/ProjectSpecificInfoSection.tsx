import {
  ProjectDataProps,
  ProjectSpecificFields,
  ProjectTabSetters,
  TrancheErrors,
} from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import ProjectOverview from './ProjectOverview'
import ProjectSubstanceDetails from './ProjectSubstanceDetails'
import { NavigationButton } from '../HelperComponents'
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
  nextStep,
  setCurrentTab,
  canEditSubstances,
  ...rest
}: ProjectDataProps &
  ProjectTabSetters &
  TrancheErrors & {
    canEditSubstances: boolean
    overviewFields: ProjectSpecificFields[]
    substanceDetailsFields: ProjectSpecificFields[]
    overviewErrors?: { [key: string]: string[] }
    substanceDetailsErrors?: { [key: string]: string[] }
    odsOdpErrors: { [key: string]: [] }[]
    nextStep: number
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
            {...{ odsOdpErrors, canEditSubstances, overviewFields }}
            {...rest}
          />
        </>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <NavigationButton type="previous" setCurrentTab={setCurrentTab} />
        <NavigationButton
          nextTab={nextStep - 1}
          setCurrentTab={setCurrentTab}
        />
      </div>
    </>
  )
}

export default ProjectSpecificInfoSection
