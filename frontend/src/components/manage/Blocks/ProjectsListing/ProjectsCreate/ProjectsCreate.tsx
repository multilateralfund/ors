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
import { DisabledAlert, LoadingTab } from '../HelperComponents.tsx'
import useGetProjectFieldsOpts from '../hooks/useGetProjectFieldsOpts.tsx'
import {
  ProjectFile,
  ProjectSpecificFields,
  ProjectTypeApi,
  ProjectFiles,
  ProjectDataProps,
  TrancheErrors,
  RelatedProjectsSectionType,
  BpDataProps,
  FileMetaDataProps,
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
  getAgencyErrorType,
  canEditField,
} from '../utils.ts'
import { useStore } from '@ors/store.tsx'

import { groupBy, has, isEmpty, map, mapKeys, pick } from 'lodash'
import { Tabs, Tab, Typography } from '@mui/material'
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
  approval = false,
  files,
  projectFiles,
  errors,
  project,
  fileErrors,
  trancheErrors,
  getTrancheErrors,
  relatedProjects,
  approvalFields = [],
  specificFieldsLoaded,
  loadedFiles,
  onBpDataChange,
  bpData,
  filesMetaData,
  setFilesMetaData,
  metaProjectId,
  setMetaProjectId,
  ...rest
}: ProjectDataProps &
  ProjectFiles &
  TrancheErrors &
  FileMetaDataProps & {
    specificFields: ProjectSpecificFields[]
    mode: string
    postExComUpdate?: boolean
    approval?: boolean
    errors: { [key: string]: [] }
    fileErrors: string
    project?: ProjectTypeApi
    projectFiles?: ProjectFile[]
    relatedProjects?: RelatedProjectsSectionType[]
    approvalFields?: ProjectSpecificFields[]
    specificFieldsLoaded: boolean
    loadedFiles?: boolean
    bpData: BpDataProps
    onBpDataChange: (bpData: BpDataProps) => void
    metaProjectId?: number | null
    setMetaProjectId?: (id: number | null) => void
  }) => {
  const { project_id } = useParams<Record<string, string>>()

  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data

  const {
    projIdentifiers,
    bpLinking,
    crossCuttingFields,
    projectSpecificFields,
    approvalFields: approvalData,
  } = projectData ?? {}
  const { project_type, sector } = crossCuttingFields

  const fieldsOpts = useGetProjectFieldsOpts(projectData, setProjectData, mode)

  const canLinkToBp = canGoToSecondStep(projIdentifiers, agency_id)

  const [currentStep, setCurrentStep] = useState<number>(canLinkToBp ? 5 : 0)
  const [currentTab, setCurrentTab] = useState<number>(approval ? 5 : 0)

  const areFieldsDisabled = !canLinkToBp || currentStep < 1
  const areNextSectionsDisabled = areFieldsDisabled || bpData.bpDataLoading
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
  const { projectFields, viewableFields, editableFields } = useStore(
    (state) => state.projectFields,
  )

  const isCrossCuttingTabDisabled =
    areNextSectionsDisabled ||
    bpData.bpDataLoading ||
    !hasFields(projectFields, viewableFields, 'Cross-Cutting')

  const hasNoSpecificInfoFields =
    overviewFields.length < 1 && substanceDetailsFields.length < 1
  const isSpecificInfoTabDisabled =
    !specificFieldsLoaded ||
    bpData.bpDataLoading ||
    areProjectSpecificTabsDisabled ||
    hasNoSpecificInfoFields ||
    (!hasFields(projectFields, viewableFields, 'Header') &&
      !hasFields(projectFields, viewableFields, 'Substance Details'))

  const isImpactTabDisabled =
    !specificFieldsLoaded ||
    bpData.bpDataLoading ||
    areProjectSpecificTabsDisabled ||
    impactFields.length < 1 ||
    !hasFields(projectFields, viewableFields, 'Impact')

  const isApprovalTabDisabled =
    areNextSectionsDisabled ||
    approvalFields.length < 1 ||
    !hasFields(projectFields, viewableFields, 'Approval')

  const isEditMode = project && mode === 'edit'
  const isApprovalTabAvailable = isEditMode && project.version >= 3

  const projIdentifiersErrors = useMemo(
    () => getProjIdentifiersErrors(projIdentifiers, errors),
    [projIdentifiers, errors],
  )
  const agencyErrorType = getAgencyErrorType(projIdentifiers, agency_id)

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

  const approvalErrors = useMemo(() => {
    const approvalCrossCuttingErrors = pick(crossCuttingErrors, [
      'total_fund',
      'support_cost_psc',
    ])

    return mode === 'edit' && project?.submission_status === 'Recommended'
      ? {
          ...getApprovalErrors(approvalData, approvalFields, errors, project),
          ...approvalCrossCuttingErrors,
        }
      : {}
  }, [approvalData, approvalFields, errors, crossCuttingErrors])

  const { canEditApprovedProjects, canViewBp } = useContext(PermissionsContext)
  const hasV3EditPermissions =
    !!project && mode === 'edit' && canEditApprovedProjects
  const editableByAdmin = ['Approved', 'Withdrawn', 'Not approved'].includes(
    project?.submission_status ?? '',
  )
  const isV3ProjectEditable =
    hasV3EditPermissions &&
    (editableByAdmin || project.submission_status === 'Recommended')

  const bpErrorMessage = 'A business plan activity should be selected.'
  const hasBpDefaultErrors =
    canViewBp &&
    mode === 'edit' &&
    canEditField(editableFields, 'bp_activity') &&
    bpData.hasBpData &&
    !bpLinking.bpId
  const allBpErrors = hasBpDefaultErrors
    ? {
        ...bpErrors,
        bp_activity: [bpErrorMessage],
      }
    : bpErrors

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

  const isActualFieldEmpty = ([key, value]: [string, string[]]) =>
    key.includes('(actual)') && value?.[0]?.includes('not completed')

  const impactPlannedErrors = Object.fromEntries(
    Object.entries(impactErrors).filter((error) => !isActualFieldEmpty(error)),
  )
  const impactActualErrors = Object.fromEntries(
    Object.entries(impactErrors).filter((error) => isActualFieldEmpty(error)),
  )

  const { errorText, isError } = trancheErrors || {}

  const fieldsForValidation = map(odsOdpFields, 'write_field_name')
  const odsOdpData = projectSpecificFields?.ods_odp ?? []

  const errorMessageExtension =
    project?.submission_status === 'Draft' ? ' for submission' : ''

  const odsOpdDataErrors =
    mode === 'edit' && odsOdpFields.length > 0
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
    project?.submission_status !== 'Withdrawn' &&
    (project?.submission_status !== 'Draft' || project?.version === 1) &&
    (project?.version ?? 0) < 3 &&
    (!project?.component ||
      project?.id === project?.component.original_project_id) &&
    getHasNoFiles(parseInt(project_id), files, projectFiles)

  const missingFileTypeErrors =
    mode === 'add' || loadedFiles
      ? map(filesMetaData, ({ type }, index) =>
          !type
            ? {
                id: index,
                message: `Attachment ${Number(index) + 1} - Type is required.`,
              }
            : null,
        ).filter(Boolean)
      : []

  const steps = [
    {
      id: 'project-identifiers',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Identifiers</div>
          {bpData.bpDataLoading
            ? LoadingTab
            : (hasSectionErrors(projIdentifiersErrors) ||
                !!agencyErrorType ||
                (postExComUpdate &&
                  !(
                    projIdentifiers.post_excom_meeting &&
                    projIdentifiers.post_excom_decision
                  )) ||
                hasBpDefaultErrors ||
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
            setCurrentStep,
            setCurrentTab,
            mode,
            project,
            postExComUpdate,
            isV3ProjectEditable,
            specificFieldsLoaded,
            onBpDataChange,
            bpData,
          }}
          areNextSectionsDisabled={areFieldsDisabled}
          isNextBtnEnabled={canLinkToBp}
          errors={projIdentifiersErrors}
          bpErrors={allBpErrors}
        />
      ),
      errors: [
        ...formatErrors({ ...projIdentifiersErrors, ...bpErrors }),
        ...(!!agencyErrorType
          ? [
              {
                message:
                  agencyErrorType === 'no_valid_agency'
                    ? 'At least one agency field must include your own agency.'
                    : agencyErrorType === 'similar_agencies'
                      ? 'Agency and lead agency cannot be similar when submitting on behalf of a cooperating agency.'
                      : 'Agency and lead agency cannot be different unless submitting on behalf of a cooperating agency.',
              },
            ]
          : []),
        ...(hasBpDefaultErrors ? [{ message: bpErrorMessage }] : []),
      ],
    },
    {
      id: 'project-cross-cutting-section',
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
            project,
            setCurrentTab,
            fieldsOpts,
            specificFieldsLoaded,
            postExComUpdate,
            isV3ProjectEditable,
            mode,
          }}
          nextStep={
            !isSpecificInfoTabDisabled ? 3 : !isImpactTabDisabled ? 4 : 5
          }
          errors={crossCuttingErrors}
        />
      ),
      errors: formatErrors(crossCuttingErrors),
    },
    {
      id: 'project-specific-info-section',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Specific Information</div>
          {!specificFieldsLoaded
            ? LoadingTab
            : !hasNoSpecificInfoFields &&
              (hasSectionErrors(overviewErrors) ||
                hasSectionErrors(substanceDetailsErrors) ||
                formattedOdsOdpErrors.length > 0 ||
                errorText ||
                (mode === 'edit' &&
                  odsOdpFields.length > 0 &&
                  odsOdpData.length === 0)) &&
              (isSpecificInfoTabDisabled ? (
                DisabledAlert
              ) : (
                <SectionErrorIndicator errors={[]} />
              ))}
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
            overviewErrors,
            substanceDetailsErrors,
            odsOdpErrors,
            trancheErrors,
            getTrancheErrors,
            setCurrentTab,
          }}
          nextStep={!isImpactTabDisabled ? 4 : 5}
        />
      ),
      errors: [
        ...formatErrors({
          ...overviewErrors,
          ...substanceDetailsErrors,
        }),
        ...(mode === 'edit' &&
        odsOdpFields.length > 0 &&
        odsOdpData.length === 0
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
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Impact</div>
          {!specificFieldsLoaded
            ? LoadingTab
            : impactFields.length >= 1 &&
              hasSectionErrors(impactErrors) &&
              (isImpactTabDisabled ? (
                DisabledAlert
              ) : (
                <SectionErrorIndicator errors={[]} />
              ))}
        </div>
      ),
      disabled: isImpactTabDisabled,
      component: (
        <ProjectImpact
          sectionFields={impactFields}
          errors={impactErrors}
          {...{
            projectData,
            setProjectData,
            project,
            setCurrentTab,
            postExComUpdate,
            hasV3EditPermissions,
          }}
          nextStep={!isSpecificInfoTabDisabled ? 3 : 2}
        />
      ),
      errors: formatErrors(impactPlannedErrors),
      actualFieldsErrors: formatErrors(impactActualErrors),
    },
    {
      id: 'project-documentation-section',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Attachments</div>
          {fileErrors ||
          (loadedFiles && hasNoFiles) ||
          missingFileTypeErrors.length > 0 ? (
            areNextSectionsDisabled || bpData.bpDataLoading ? (
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
          {...{
            projectFiles,
            files,
            mode,
            project,
            loadedFiles,
            setCurrentTab,
            filesMetaData,
            setFilesMetaData,
          }}
          nextStep={
            !isImpactTabDisabled ? 4 : !isSpecificInfoTabDisabled ? 3 : 2
          }
          hasNextStep={mode === 'edit'}
          isNextButtonDisabled={
            isApprovalTabAvailable ? isApprovalTabDisabled : false
          }
          errors={missingFileTypeErrors}
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
        ...missingFileTypeErrors,
      ],
    },
    ...(isApprovalTabAvailable
      ? [
          {
            id: 'project-approval-section',
            label: (
              <div className="relative flex items-center justify-between gap-x-2">
                <div className="leading-tight">Approval</div>
                {approvalFields.length === 0
                  ? LoadingTab
                  : hasSectionErrors(approvalErrors) &&
                    (isApprovalTabDisabled || bpData.bpDataLoading ? (
                      DisabledAlert
                    ) : (
                      <SectionErrorIndicator errors={[]} />
                    ))}
              </div>
            ),
            disabled: isApprovalTabDisabled,
            component: (
              <ProjectApprovalFields
                sectionFields={approvalFields as ProjectSpecificFields[]}
                {...{
                  projectData,
                  setProjectData,
                  project,
                  setCurrentTab,
                }}
                errors={approvalErrors}
              />
            ),
            errors: formatErrors(approvalErrors),
          },
        ]
      : []),
    ...(isEditMode
      ? [
          {
            id: 'project-related-projects-section',
            label: 'Related projects',
            disabled: areNextSectionsDisabled,
            component: (
              <ProjectRelatedProjects
                canDisassociate={postExComUpdate}
                {...{
                  project,
                  relatedProjects,
                  metaProjectId,
                  setMetaProjectId,
                  setCurrentTab,
                }}
              />
            ),
          },
        ]
      : []),
    ...(isEditMode
      ? [
          {
            id: 'project-history-section',
            label: (
              <div className="relative flex items-center justify-between gap-x-2">
                <div className="leading-tight">History</div>
              </div>
            ),
            disabled: areNextSectionsDisabled,
            component: <ProjectHistory {...{ project, setCurrentTab }} />,
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
        {steps.map(({ id, label, disabled }) => (
          <Tab
            key={id}
            id={id}
            aria-controls={id}
            label={label}
            disabled={disabled}
            classes={{
              disabled: 'text-gray-300',
            }}
          />
        ))}
      </Tabs>

      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {steps
          .filter((_, index) => index === currentTab)
          .map(({ id, component, errors, actualFieldsErrors }) => {
            return (
              <span key={id}>
                {mode === 'edit' &&
                  project?.submission_status === 'Approved' &&
                  !postExComUpdate &&
                  !canEditApprovedProjects && (
                    <CustomAlert
                      type="info"
                      alertClassName="mb-3"
                      content={
                        <Typography className="text-lg leading-5">
                          You are editing the approved version of the project
                          (version 3). Any other updates can be brought only by
                          adding post ExCom updates.
                        </Typography>
                      }
                    />
                  )}
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
                {actualFieldsErrors && actualFieldsErrors.length > 0 && (
                  <CustomAlert
                    type="info"
                    alertClassName="mb-5"
                    content={
                      <Typography>
                        <div className="flex flex-col gap-y-3">
                          {actualFieldsErrors.map((err, idx) =>
                            err ? (
                              <div key={idx}>
                                {'\u2022'} {err.message}
                              </div>
                            ) : null,
                          )}
                        </div>
                      </Typography>
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
