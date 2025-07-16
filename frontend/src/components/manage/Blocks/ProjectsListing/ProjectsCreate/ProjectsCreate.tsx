'use client'

import { Dispatch, ReactNode, SetStateAction, useMemo, useState } from 'react'

import ProjectHistory from '@ors/components/manage/Blocks/ProjectsListing/ProjectView/ProjectHistory.tsx'
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
  TrancheErrors,
} from '../interfaces.ts'
import {
  canGoToSecondStep,
  checkInvalidValue,
  formatErrors,
  getCrossCuttingErrors,
  getFieldLabel,
  getProjIdentifiersErrors,
  getSectionFields,
  getSpecificFieldsErrors,
  getHasNoFiles,
  hasSectionErrors,
  hasIdentifierFields,
} from '../utils.ts'
import { useStore } from '@ors/store.tsx'

import { find, groupBy, has, isArray, isEmpty, map, mapKeys } from 'lodash'
import { Tabs, Tab, Alert, Typography } from '@mui/material'
import { MdErrorOutline } from 'react-icons/md'

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
  projectFiles,
  errors,
  setErrors,
  hasSubmitted,
  project,
  fileErrors,
  trancheErrors,
  getTrancheErrors,
  ...rest
}: ProjectDataProps &
  ProjectFiles &
  TrancheErrors & {
    specificFields: ProjectSpecificFields[]
    mode: string
    errors: { [key: string]: [] }
    setErrors: Dispatch<SetStateAction<{ [key: string]: [] }>>
    hasSubmitted: boolean
    fileErrors: string
    project?: ProjectTypeApi
    projectFiles?: ProjectFile[]
  }) => {
  const [currentStep, setCurrentStep] = useState<number>(
    mode !== 'add' && mode !== 'partial-link' ? 1 : 0,
  )
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
  const groupedFields = groupBy(substanceDetailsFields, 'table')
  const odsOdpFields = (groupedFields['ods_odp'] || []).filter(
    (field) => field.read_field_name !== 'sort_order',
  )
  const { projectFields, viewableFields } = useStore(
    (state) => state.projectFields,
  )
  const allFields = isArray(projectFields) ? projectFields : projectFields?.data

  const isCrossCuttingTabDisabled = !find(
    allFields,
    (field) => field.section === 'Cross-Cutting',
  )
  const isSpecificInfoTabDisabled =
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
    () =>
      getCrossCuttingErrors(
        crossCuttingFields,
        errors,
        mode,
        mode === 'edit' ? project : undefined,
      ),
    [crossCuttingFields, errors, mode],
  )

  const specificFieldsErrors = useMemo(
    () =>
      getSpecificFieldsErrors(
        projectSpecificFields,
        specificFields,
        errors,
        mode,
        project,
      ),
    [projectSpecificFields, specificFields, errors, mode, project],
  )
  const overviewErrors = specificFieldsErrors['Header'] || {}
  const substanceDetailsErrors = specificFieldsErrors['Substance Details'] || {}
  const impactErrors = specificFieldsErrors['Impact'] || {}
  const { errorText, isError } = trancheErrors || {}

  const fieldsForValidation = map(odsOdpFields, 'write_field_name')
  const odsOdpData = projectSpecificFields?.ods_odp ?? []

  const errorMessageExtension =
    project?.submission_status === 'Draft' ? ' for submission' : ''

  const odsOpdDataErrors =
    mode === 'edit'
      ? map(odsOdpData, (odsOdp) => {
          const errors = map(fieldsForValidation, (field) =>
            checkInvalidValue(odsOdp[field])
              ? [field, [`This field is required${errorMessageExtension}.`]]
              : null,
          ).filter(Boolean) as [string, string[]][]

          return Object.fromEntries(errors)
        })
      : []

  const formattedOdsOdp = map(odsOpdDataErrors, (error, index) => ({
    ...error,
    ...(((errors?.ods_odp ?? [])[index] as Record<string, []>) || {}),
  }))

  const filteredOdsOdpErrors = map(formattedOdsOdp, (odp, index) =>
    !isEmpty(odp) ? { ...odp, id: index } : { ...odp },
  ).filter((odp) => !isEmpty(odp) && !has(odp, 'non_field_errors'))

  const formattedOdsOdpErrors = map(
    filteredOdsOdpErrors,
    ({ id, ...fields }) => {
      const fieldLabels = map(
        fields as Record<string, string[]>,
        (errorMsgs, field) => {
          if (Array.isArray(errorMsgs) && errorMsgs.length > 0) {
            return getFieldLabel(specificFields, field)
          }
          return null
        },
      ).filter(Boolean)

      if (fieldLabels.length === 0) return null

      return {
        message: `Substance ${Number(id) + 1} - ${fieldLabels.join(', ')}: ${fieldLabels.length > 1 ? 'These fields are' : 'This field is'} required${errorMessageExtension}.`,
      }
    },
  ).filter(Boolean)

  const odsOdpErrors = map(
    formattedOdsOdp as { [key: string]: [] }[],
    (error) => mapKeys(error, (_, key) => getFieldLabel(specificFields, key)),
  )

  const hasNoFiles = mode === 'edit' && getHasNoFiles(files, projectFiles)

  const steps = [
    {
      step: 0,
      id: 'project-identifiers',
      ariaControls: 'project-identifiers',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Identifiers</div>
          {(hasSectionErrors(projIdentifiersErrors) ||
            hasSectionErrors(bpErrors)) && (
            <SectionErrorIndicator errors={[]} />
          )}
        </div>
      ),
      disabled: !hasIdentifierFields(allFields, viewableFields, true),
      component: (
        <ProjectIdentifiersSection
          {...{
            projectData,
            setProjectData,
            areNextSectionsDisabled,
            setCurrentStep,
            setCurrentTab,
            hasSubmitted,
            mode,
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
          <div className="leading-tight">Cross-Cutting</div>
          {!areNextSectionsDisabled && hasSectionErrors(crossCuttingErrors) && (
            <SectionErrorIndicator errors={[]} />
          )}
        </div>
      ),
      disabled: areNextSectionsDisabled || isCrossCuttingTabDisabled,
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
          <div className="leading-tight">Specific Information</div>
          {!isSpecificInfoTabDisabled &&
            (hasSectionErrors(overviewErrors) ||
              hasSectionErrors(substanceDetailsErrors) ||
              formattedOdsOdpErrors.length > 0 ||
              errorText ||
              (mode === 'edit' && odsOdpData.length === 0)) && (
              <SectionErrorIndicator errors={[]} />
            )}
        </div>
      ),
      disabled: isSpecificInfoTabDisabled,
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
            trancheErrors,
            getTrancheErrors,
          }}
        />
      ),
      errors: [
        ...formatErrors({
          ...overviewErrors,
          ...substanceDetailsErrors,
        }),
        ...(mode === 'edit' && odsOdpData.length === 0
          ? [
              {
                message: `At least a substance must be provided${errorMessageExtension}.`,
              },
            ]
          : []),
        ...formattedOdsOdpErrors,
        ...(errorText && isError ? [{ message: errorText }] : []),
      ],
    },
    {
      step: 3,
      id: 'project-impact-section',
      ariaControls: 'project-impact-section',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Impact</div>
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
          <div className="leading-tight">Documentation</div>
          {!areNextSectionsDisabled && (fileErrors || hasNoFiles) ? (
            <SectionErrorIndicator errors={[]} />
          ) : null}
        </div>
      ),
      disabled: areNextSectionsDisabled,
      component: (
        <ProjectDocumentation
          {...{ projectFiles, files, mode, project }}
          {...rest}
        />
      ),
      errors: [
        ...(fileErrors
          ? [
              {
                message: fileErrors,
              },
            ]
          : []),
        ...(hasNoFiles
          ? [
              {
                message: `At least a file must be provided${errorMessageExtension}.`,
              },
            ]
          : []),
      ],
    },
    ...(project && mode === 'edit'
      ? [
          {
            step: 5,
            id: 'project-history-section',
            ariaControls: 'project-history-section',
            label: (
              <div className="relative flex items-center justify-between gap-x-2">
                <div className="leading-tight">History</div>
              </div>
            ),
            disabled: false,
            component: <ProjectHistory mode={mode} project={project} />,
          },
        ]
      : []),
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
                {errors && errors.length > 0 && (
                  <Alert
                    className="mb-5 w-fit border-0 bg-[#FAECD1] text-[#291B00]"
                    severity="error"
                    icon={<MdErrorOutline color="#291B00" />}
                  >
                    <Typography className="text-lg">
                      Please make sure all the sections are valid.
                    </Typography>
                    <Typography>
                      <div className="mt-1">
                        {errors.map((err, idx) =>
                          err ? (
                            <div key={idx} className="py-1.5">
                              {'\u2022'} {err.message}
                            </div>
                          ) : null,
                        )}
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
