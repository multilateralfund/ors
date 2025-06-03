'use client'

import { Dispatch, ReactNode, SetStateAction, useMemo, useState } from 'react'

import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator.tsx'
import ProjectIdentifiersSection from './ProjectIdentifiersSection.tsx'
import ProjectCrossCuttingFields from './ProjectCrossCuttingFields'
import ProjectSpecificInfoSection from './ProjectSpecificInfoSection.tsx'
import ProjectImpact from './ProjectImpact.tsx'
import ProjectDocumentation from '../ProjectView/ProjectDocumentation.tsx'
import { tableColumns } from '../constants.ts'
import {
  ProjectFile,
  ProjectSpecificFields,
  ProjectTypeApi,
  ProjectFiles,
  ProjectDataProps,
} from '../interfaces.ts'
import {
  canGoToSecondStep,
  getCrossCuttingErrors,
  getProjIdentifiersErrors,
  getSectionFields,
  getSpecificFieldsErrors,
} from '../utils.ts'

import { Tabs, Tab, Alert, Typography } from '@mui/material'
import { isEmpty, map } from 'lodash'

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
  const { ods_odp = [] } = projectSpecificFields

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

  const substanceDetailsErrorIndexes = ods_odp
    .map((item, index) => (!item.ods_substance_id ? index : -1))
    .filter((index) => index !== -1)

  const substanceError = { ods_substance_id: ['This field is required.'] }
  const updatedOdsOdpErrors = errors?.ods_odp
    ? errors.ods_odp.map((item: { [key: string]: [] }, index) =>
        substanceDetailsErrorIndexes.includes(index)
          ? { ...item, ...substanceError }
          : item,
      )
    : substanceDetailsErrorIndexes.length > 0
      ? ods_odp.map((_, index) =>
          substanceDetailsErrorIndexes.includes(index) ? substanceError : {},
        )
      : []
  const odsOdpErrors = map(
    updatedOdsOdpErrors as { [key: string]: [] }[],
    (odp, index) => (!isEmpty(odp) ? { ...odp, id: index } : { ...odp }),
  ).filter((odp) => !isEmpty(odp))

  const formattedOdsOdpErrors = odsOdpErrors.flatMap((err) => {
    const { id, ...fields } = err

    return Object.entries(fields)
      .filter(
        ([field, errorMsgs]) =>
          Array.isArray(errorMsgs) &&
          errorMsgs.length > 0 &&
          field !== 'non_field_errors',
      )
      .flatMap(([field, errorMsgs]) => {
        const specificField = specificFields.find(
          ({ write_field_name }) => write_field_name === field,
        )
        const label = specificField?.label ?? field

        return errorMsgs.map((msg) => ({
          id: `${label}-${id}`,
          message: `Substance ${(id as number) + 1} - ${label}: ${msg}`,
        }))
      })
  })

  const hasSectionErrors = (errors: { [key: string]: string[] }) =>
    Object.values(errors).some((errors) => errors.length > 0)

  const formatErrors = (errors: { [key: string]: string[] }) =>
    Object.entries(errors)
      .filter(([, errorMsgs]) => errorMsgs.length > 0)
      .flatMap(([field, errorMsgs]) =>
        errorMsgs.map((errMsg, idx) => ({
          id: `${field}-${idx}`,
          message: `${tableColumns[field] ?? field}: ${errMsg}`,
        })),
      )

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
            <SectionErrorIndicator
              errors={formatErrors({ ...projIdentifiersErrors, ...bpErrors })}
            />
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
    },
    {
      step: 1,
      id: 'project-cross-cutting-section',
      ariaControls: 'project-cross-cutting-section',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div>Cross-Cutting</div>
          {!areNextSectionsDisabled && hasSectionErrors(crossCuttingErrors) && (
            <SectionErrorIndicator errors={formatErrors(crossCuttingErrors)} />
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
              <SectionErrorIndicator
                errors={[
                  ...formatErrors({
                    ...overviewErrors,
                    ...substanceDetailsErrors,
                  }),
                  ...formattedOdsOdpErrors,
                ]}
              />
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
    },
    {
      step: 3,
      id: 'project-impact-section',
      ariaControls: 'project-impact-section',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div>Impact</div>
          {!isImpactTabDisabled && hasSectionErrors(impactErrors) && (
            <SectionErrorIndicator errors={formatErrors(impactErrors)} />
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
    },
    {
      step: 4,
      id: 'project-documentation-section',
      ariaControls: 'project-documentation-section',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div>Documentation</div>
          {!areNextSectionsDisabled && fileErrors ? (
            <SectionErrorIndicator
              errors={[
                {
                  id: '1',
                  message: fileErrors,
                },
              ]}
            />
          ) : null}
        </div>
      ),
      disabled: areNextSectionsDisabled,
      component: <ProjectDocumentation {...rest} {...{ files, mode }} />,
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
        {!isEmpty(errors) && (
          <Alert className="mb-12" severity="error">
            <Typography>
              Please make sure all the sections are valid.
            </Typography>
          </Alert>
        )}
        {steps
          .filter(({ step }) => step === currentTab)
          .map(({ component }) => component)}
      </div>
    </>
  )
}

export default ProjectsCreate
