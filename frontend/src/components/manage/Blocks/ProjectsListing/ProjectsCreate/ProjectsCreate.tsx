'use client'

import { Dispatch, ReactNode, SetStateAction, useMemo, useState } from 'react'

import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator.tsx'
import ProjectIdentifiersSection from './ProjectIdentifiersSection.tsx'
import ProjectCrossCuttingFields from './ProjectCrossCuttingFields'
import ProjectSpecificInfoSection from './ProjectSpecificInfoSection.tsx'
import ProjectImpact from './ProjectImpact.tsx'
import ProjectDocumentation from '../ProjectView/ProjectDocumentation.tsx'
import {
  ProjectFile,
  ProjectSpecificFields,
  ProjectTypeApi,
  ProjectFiles,
  ProjectDataProps,
} from '../interfaces.ts'
import {
  canGoToSecondStep,
  formatErrors,
  getCrossCuttingErrors,
  getFieldLabel,
  getProjIdentifiersErrors,
  getSectionFields,
  getSpecificFieldsErrors,
} from '../utils.ts'

import { Tabs, Tab, Alert, Typography } from '@mui/material'
import { has, isArray, isEmpty, map, mapKeys } from 'lodash'

export const SectionTitle = ({ children }: { children: ReactNode }) => (
  <div className="mb-4 text-xl uppercase tracking-[1px] text-typography-sectionTitle">
    {children}
  </div>
)

const ProjectsCreate = ({
  projectData,
  setProjectData,
  specificFields,
  mode,
  files,
  errors,
  setErrors,
  hasSubmitted,
  project,
  fileErrors,
  ...rest
}: ProjectDataProps &
  ProjectFiles & {
    specificFields: ProjectSpecificFields[]
    mode: string
    errors: { [key: string]: [] }
    setErrors: Dispatch<SetStateAction<{ [key: string]: [] }>>
    hasSubmitted: boolean
    fileErrors: string
    project?: ProjectTypeApi
    projectFiles?: ProjectFile[]
  }) => {
  const [currentStep, setCurrentStep] = useState<number>(mode !== 'add' ? 1 : 0)
  const [currentTab, setCurrentTab] = useState<number>(0)

  const { projIdentifiers, crossCuttingFields, projectSpecificFields } =
    projectData ?? {}
  const { project_type, sector } = crossCuttingFields

  const canLinkToBp = canGoToSecondStep(projIdentifiers)

  const areNextSectionsDisabled = !canLinkToBp || currentStep < 1
  const areProjectSpecificTabsDisabled =
    areNextSectionsDisabled || !project_type || !sector

  const [overviewFields, substanceDetailsFields, impactFields] = [
    getSectionFields(specificFields, 'Header'),
    getSectionFields(specificFields, 'Substance Details'),
    getSectionFields(specificFields, 'Impact'),
  ]

  const isSpecificInfoTabDisalbed =
    areProjectSpecificTabsDisabled ||
    (overviewFields.length < 1 && substanceDetailsFields.length < 1)
  const isImpactTabDisabled =
    areProjectSpecificTabsDisabled || impactFields.length < 1

  const projIdentifiersErrors = useMemo(
    () => getProjIdentifiersErrors(projIdentifiers, errors),
    [projIdentifiers, errors],
  )

  const bpErrors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(errors ?? {}).filter(([key]) => key === 'bp_activity'),
      ),
    [errors],
  )

  const crossCuttingErrors = useMemo(
    () => getCrossCuttingErrors(crossCuttingFields, errors),
    [crossCuttingFields, errors],
  )

  const specificFieldsErrors = useMemo(
    () =>
      getSpecificFieldsErrors(projectSpecificFields, specificFields, errors),
    [projectSpecificFields, specificFields, errors],
  )
  const overviewErrors = specificFieldsErrors['Header'] || {}
  const substanceDetailsErrors = specificFieldsErrors['Substance Details'] || {}
  const impactErrors = specificFieldsErrors['Impact'] || {}

  const filteredOdsOdpErrors = map(
    errors?.ods_odp as { [key: string]: [] }[],
    (odp, index) => (!isEmpty(odp) ? { ...odp, id: index } : { ...odp }),
  ).filter((odp) => !isEmpty(odp) && !has(odp, 'non_field_errors'))

  const formattedOdsOdpErrors = filteredOdsOdpErrors.flatMap((err) => {
    const { id, ...fields } = err

    return Object.entries(fields)
      .filter(([_, errorMsgs]) => isArray(errorMsgs) && errorMsgs.length > 0)
      .flatMap(([field, errorMsgs]) => {
        const label = getFieldLabel(specificFields, field)

        return errorMsgs.map((msg) => ({
          id: `${label}-${id}`,
          message: `Entry ${(id as number) + 1} - ${label}: ${msg}`,
        }))
      })
  })

  const odsOdpErrors = map(
    errors?.ods_odp as { [key: string]: [] }[],
    (error) => mapKeys(error, (_, key) => getFieldLabel(specificFields, key)),
  )

  const hasSectionErrors = (errors: { [key: string]: string[] }) =>
    Object.values(errors).some((errors) => errors.length > 0)

  const steps = [
    {
      step: 0,
      id: 'project-identifiers',
      ariaControls: 'project-identifiers',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div>Identifiers</div>
          {(hasSectionErrors(projIdentifiersErrors) ||
            hasSectionErrors(bpErrors)) && (
            <SectionErrorIndicator errors={[]} />
          )}
        </div>
      ),
      component: (
        <ProjectIdentifiersSection
          {...{
            projectData,
            setProjectData,
            areNextSectionsDisabled,
            setCurrentStep,
            setCurrentTab,
            hasSubmitted,
          }}
          isNextBtnEnabled={canLinkToBp}
          errors={projIdentifiersErrors}
        />
      ),
      errors: formatErrors({ ...projIdentifiersErrors, ...bpErrors }),
    },
    {
      step: 1,
      id: 'project-cross-cutting-section',
      ariaControls: 'project-cross-cutting-section',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div>Cross-Cutting</div>
          {!areNextSectionsDisabled && hasSectionErrors(crossCuttingErrors) && (
            <SectionErrorIndicator errors={[]} />
          )}
        </div>
      ),
      disabled: areNextSectionsDisabled,
      component: (
        <ProjectCrossCuttingFields
          {...{
            projectData,
            setProjectData,
            hasSubmitted,
          }}
          errors={crossCuttingErrors}
        />
      ),
      errors: formatErrors(crossCuttingErrors),
    },
    {
      step: 2,
      id: 'project-specific-info-section',
      ariaControls: 'project-specific-info-section',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div>Specific Information</div>
          {!isSpecificInfoTabDisalbed &&
            (hasSectionErrors(overviewErrors) ||
              hasSectionErrors(substanceDetailsErrors) ||
              formattedOdsOdpErrors.length > 0) && (
              <SectionErrorIndicator errors={[]} />
            )}
        </div>
      ),
      disabled: isSpecificInfoTabDisalbed,
      component: (
        <ProjectSpecificInfoSection
          {...{
            projectData,
            setProjectData,
            overviewFields,
            substanceDetailsFields,
            hasSubmitted,
            overviewErrors,
            substanceDetailsErrors,
            odsOdpErrors,
          }}
        />
      ),
      errors: [
        ...formatErrors({
          ...overviewErrors,
          ...substanceDetailsErrors,
        }),
        ...formattedOdsOdpErrors,
      ],
    },
    {
      step: 3,
      id: 'project-impact-section',
      ariaControls: 'project-impact-section',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div>Impact</div>
          {!isImpactTabDisabled && hasSectionErrors(impactErrors) && (
            <SectionErrorIndicator errors={[]} />
          )}
        </div>
      ),
      disabled: isImpactTabDisabled,
      component: (
        <ProjectImpact
          sectionFields={impactFields}
          errors={impactErrors}
          {...{ projectData, setProjectData, hasSubmitted }}
        />
      ),
      errors: formatErrors(impactErrors),
    },
    {
      step: 4,
      id: 'project-documentation-section',
      ariaControls: 'project-documentation-section',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div>Documentation</div>
          {!areNextSectionsDisabled && fileErrors ? (
            <SectionErrorIndicator errors={[]} />
          ) : null}
        </div>
      ),
      disabled: areNextSectionsDisabled,
      component: <ProjectDocumentation {...rest} {...{ files, mode }} />,
      errors: [
        {
          id: '1',
          message: fileErrors,
        },
      ],
    },
  ]

  return (
    <>
      <Tabs
        aria-label="create-project"
        value={currentTab}
        className="sectionsTabs"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        TabIndicatorProps={{
          className: 'h-0',
          style: { transitionDuration: '150ms' },
        }}
        onChange={(_, newValue) => {
          setCurrentTab(newValue)
        }}
      >
        {steps.map(({ id, ariaControls, label, disabled }) => (
          <Tab
            id={id}
            aria-controls={ariaControls}
            label={label}
            disabled={disabled}
            classes={{
              disabled: 'text-gray-200',
            }}
          />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {steps
          .filter(({ step }) => step === currentTab)
          .map(({ component, errors }) => {
            return (
              <>
                {errors.length > 0 && (
                  <Alert className="mb-5" severity="error">
                    <Typography>
                      Please make sure all the sections are valid.
                      <div className="mt-1">
                        {errors.map((err, idx) => (
                          <div key={idx} className="py-1.5">
                            {'\u2022'} {err.message}
                          </div>
                        ))}
                      </div>
                    </Typography>
                  </Alert>
                )}
                {component}
              </>
            )
          })}
      </div>
    </>
  )
}

export default ProjectsCreate
