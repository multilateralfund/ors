'use client'

import { ReactNode, useContext, useMemo, useState } from 'react'

import ProjectHistory from '@ors/components/manage/Blocks/ProjectsListing/ProjectView/ProjectHistory.tsx'
import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator.tsx'
import CustomAlert from '@ors/components/theme/Alerts/CustomAlert.tsx'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import ProjectIdentifiersSection from './ProjectIdentifiersSection.tsx'
import ProjectCrossCuttingFields from './ProjectCrossCuttingFields'
import ProjectSpecificInfoSection from './ProjectSpecificInfoSection.tsx'
import ProjectImpact from './ProjectImpact.tsx'
import ProjectDocumentation from '../ProjectView/ProjectDocumentation.tsx'
import ProjectApprovalFields from './ProjectApprovalFields.tsx'
import ProjectRelatedProjects from '../ProjectView/ProjectRelatedProjects.tsx'
import { DisabledAlert } from '../HelperComponents.tsx'
import useGetProjectFieldsOpts from '../hooks/useGetProjectFieldsOpts.tsx'
import {
  ProjectFile,
  ProjectSpecificFields,
  ProjectTypeApi,
  ProjectFiles,
  ProjectDataProps,
  TrancheErrors,
  RelatedProjectsSectionType,
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
  hasFields,
  getApprovalErrors,
} from '../utils.ts'
import { useStore } from '@ors/store.tsx'

import { Tabs, Tab, Typography, CircularProgress } from '@mui/material'
import { groupBy, has, isEmpty, map, mapKeys } from 'lodash'
import { useParams } from 'wouter'

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
  postExComUpdate = false,
  files,
  projectFiles,
  errors,
  hasSubmitted,
  project,
  fileErrors,
  trancheErrors,
  getTrancheErrors,
  relatedProjects,
  approvalFields = [],
  specificFieldsLoaded,
  loadedFiles,
  ...rest
}: ProjectDataProps &
  ProjectFiles &
  TrancheErrors & {
    specificFields: ProjectSpecificFields[]
    mode: string
    postExComUpdate?: boolean
    errors: { [key: string]: [] }
    hasSubmitted: boolean
    fileErrors: string
    project?: ProjectTypeApi
    projectFiles?: ProjectFile[]
    relatedProjects?: RelatedProjectsSectionType[]
    approvalFields?: ProjectSpecificFields[]
    specificFieldsLoaded: boolean
    loadedFiles?: boolean
  }) => {
  const { project_id } = useParams<Record<string, string>>()

  const {
    projIdentifiers,
    crossCuttingFields,
    projectSpecificFields,
    approvalFields: approvalData,
  } = projectData ?? {}
  const { project_type, sector } = crossCuttingFields

  const fieldsOpts = useGetProjectFieldsOpts(projectData, setProjectData, mode)

  const canLinkToBp = canGoToSecondStep(projIdentifiers)

  const [currentStep, setCurrentStep] = useState<number>(canLinkToBp ? 1 : 0)
  const [currentTab, setCurrentTab] = useState<number>(0)

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

  const { warnings } = useStore((state) => state.projectWarnings)
  const { projectFields, viewableFields } = useStore(
    (state) => state.projectFields,
  )

  const isCrossCuttingTabDisabled =
    areNextSectionsDisabled ||
    !hasFields(projectFields, viewableFields, 'Cross-Cutting')

  const hasNoSpecificInfoFields =
    overviewFields.length < 1 && substanceDetailsFields.length < 1
  const isSpecificInfoTabDisabled =
    !specificFieldsLoaded ||
    areProjectSpecificTabsDisabled ||
    hasNoSpecificInfoFields ||
    (!hasFields(projectFields, viewableFields, 'Header') &&
      !hasFields(projectFields, viewableFields, 'Substance Details'))

  const isImpactTabDisabled =
    !specificFieldsLoaded ||
    areProjectSpecificTabsDisabled ||
    impactFields.length < 1 ||
    !hasFields(projectFields, viewableFields, 'Impact')

  const isApprovalTabDisabled =
    areNextSectionsDisabled ||
    approvalFields.length < 1 ||
    !hasFields(projectFields, viewableFields, 'Approval')

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

  const approvalErrors = useMemo(
    () =>
      mode === 'edit'
        ? getApprovalErrors(approvalData, approvalFields, errors, project)
        : {},
    [approvalData, approvalFields, errors],
  )

  const { canEditApprovedProjects } = useContext(PermissionsContext)

  const specificFieldsErrors = useMemo(
    () =>
      getSpecificFieldsErrors(
        projectSpecificFields,
        specificFields,
        errors,
        mode,
        canEditApprovedProjects,
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

  const hasNoFiles =
    mode === 'edit' &&
    getHasNoFiles(parseInt(project_id), files, projectFiles) &&
    (project?.version ?? 0) < 3

  const steps = [
    {
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
      disabled: !hasFields(projectFields, viewableFields, 'Identifiers'),
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
            project,
            postExComUpdate,
            specificFieldsLoaded,
          }}
          isNextBtnEnabled={canLinkToBp}
          errors={projIdentifiersErrors}
        />
      ),
      errors: formatErrors({ ...projIdentifiersErrors, ...bpErrors }),
    },
    {
      id: 'project-cross-cutting-section',
      ariaControls: 'project-cross-cutting-section',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Cross-Cutting</div>
          {hasSectionErrors(crossCuttingErrors) &&
            (isCrossCuttingTabDisabled ? (
              DisabledAlert
            ) : (
              <SectionErrorIndicator errors={[]} />
            ))}
        </div>
      ),
      disabled: isCrossCuttingTabDisabled,
      component: (
        <ProjectCrossCuttingFields
          {...{
            projectData,
            setProjectData,
            hasSubmitted,
            fieldsOpts,
            specificFieldsLoaded,
          }}
          errors={crossCuttingErrors}
        />
      ),
      errors: formatErrors(crossCuttingErrors),
    },
    {
      id: 'project-specific-info-section',
      ariaControls: 'project-specific-info-section',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Specific Information</div>
          {!specificFieldsLoaded ? (
            <CircularProgress size="20px" className="mb-0.5 text-gray-400" />
          ) : (
            !hasNoSpecificInfoFields &&
            (hasSectionErrors(overviewErrors) ||
              hasSectionErrors(substanceDetailsErrors) ||
              formattedOdsOdpErrors.length > 0 ||
              errorText ||
              (mode === 'edit' && odsOdpData.length === 0)) &&
            (isSpecificInfoTabDisabled ? (
              DisabledAlert
            ) : (
              <SectionErrorIndicator errors={[]} />
            ))
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
      id: 'project-impact-section',
      ariaControls: 'project-impact-section',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Impact</div>
          {!specificFieldsLoaded ? (
            <CircularProgress size="20px" className="mb-0.5 text-gray-400" />
          ) : (
            impactFields.length >= 1 &&
            hasSectionErrors(impactErrors) &&
            (isImpactTabDisabled ? (
              DisabledAlert
            ) : (
              <SectionErrorIndicator errors={[]} />
            ))
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
      id: 'project-documentation-section',
      ariaControls: 'project-documentation-section',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Documentation</div>
          {fileErrors || (loadedFiles && hasNoFiles) ? (
            areNextSectionsDisabled ? (
              DisabledAlert
            ) : (
              <SectionErrorIndicator errors={[]} />
            )
          ) : null}
        </div>
      ),
      disabled: areNextSectionsDisabled,
      component: (
        <ProjectDocumentation
          {...{ projectFiles, files, mode, project, loadedFiles }}
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
        ...(loadedFiles && hasNoFiles
          ? [
              {
                message: `At least one file must be attached to this version${errorMessageExtension}.`,
              },
            ]
          : []),
      ],
    },
    ...(project && mode === 'edit' && project.version >= 3
      ? [
          {
            id: 'project-approval-section',
            ariaControls: 'project-approval-section',
            label: (
              <div className="relative flex items-center justify-between gap-x-2">
                <div className="leading-tight">Approval</div>
                {approvalFields.length === 0 ? (
                  <CircularProgress
                    size="20px"
                    className="mb-0.5 text-gray-400"
                  />
                ) : (
                  hasSectionErrors(approvalErrors) &&
                  (isApprovalTabDisabled ? (
                    DisabledAlert
                  ) : (
                    <SectionErrorIndicator errors={[]} />
                  ))
                )}
              </div>
            ),
            disabled: isApprovalTabDisabled,
            component: (
              <ProjectApprovalFields
                sectionFields={approvalFields as ProjectSpecificFields[]}
                {...{
                  projectData,
                  setProjectData,
                  hasSubmitted,
                }}
                errors={approvalErrors}
              />
            ),
            errors: formatErrors(approvalErrors),
          },
        ]
      : []),
    ...(project && mode === 'edit'
      ? [
          {
            id: 'project-related-projects-section',
            ariaControls: 'project-related-projects-section',
            label: 'Related projects',
            component: <ProjectRelatedProjects {...{ relatedProjects }} />,
          },
        ]
      : []),
    ...(project && mode === 'edit'
      ? [
          {
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
            key={id}
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
          .filter((_, index) => index === currentTab)
          .map(({ id, component, errors }) => {
            return (
              <span key={id}>
                {mode === 'edit' &&
                  project?.submission_status === 'Draft' &&
                  warnings.id === parseInt(project_id) &&
                  warnings.warnings.length > 0 && (
                    <CustomAlert
                      type="info"
                      alertClassName="mb-3"
                      content={
                        <Typography className="pt-0.5 text-lg leading-none">
                          {warnings.warnings[0]}
                        </Typography>
                      }
                    />
                  )}
                {errors && errors.length > 0 && (
                  <CustomAlert
                    type="error"
                    alertClassName="mb-5"
                    content={
                      <>
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
                      </>
                    }
                  />
                )}
                {component}
              </span>
            )
          })}
      </div>
    </>
  )
}

export default ProjectsCreate
