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
import { getFieldData, getOdsOdpFields, hasFields } from '../utils'
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
  disableV3Edit,
  ...rest
}: ProjectDataProps &
  ProjectTabSetters &
  TrancheErrors & {
    overviewFields: ProjectSpecificFields[]
    substanceDetailsFields: ProjectSpecificFields[]
    overviewErrors?: { [key: string]: string[] }
    substanceDetailsErrors?: { [key: string]: string[] }
    odsOdpErrors: { [key: string]: [] }[]
    nextStep: number
    disableV3Edit: boolean
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

  const odsOdpFields = getOdsOdpFields(substanceDetailsFields)
  const odpDisplayField = getFieldData(odsOdpFields, 'ods_display_name')

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
          <SectionTitle>
            {odpDisplayField || odsOdpFields.length === 0
              ? 'Substance'
              : 'Phase out'}{' '}
            details
          </SectionTitle>
          <ProjectSubstanceDetails
            sectionFields={substanceDetailsFields}
            errors={substanceDetailsErrors}
            {...{ odsOdpErrors, overviewFields, disableV3Edit }}
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
