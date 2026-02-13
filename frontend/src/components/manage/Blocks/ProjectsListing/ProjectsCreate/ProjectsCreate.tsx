'use client'

import { ReactNode, useContext, useEffect, useMemo, useState } from 'react'

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
import ProjectDelete from './ProjectDelete.tsx'
import { DisabledAlert, LoadingTab } from '../HelperComponents.tsx'
import useGetProjectFieldsOpts from '../hooks/useGetProjectFieldsOpts.tsx'
import { MetaProjectDetailType } from '../UpdateMyaData/types.ts'
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
  getPostExcomApprovalErrors,
  getFieldData,
  formatOptions,
  getOdsOdpFields,
  getPostExcomMeetingErrors,
} from '../utils.ts'
import { useStore } from '@ors/store.tsx'

import { find, has, isEmpty, map, mapKeys, pick } from 'lodash'
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
  impact = false,
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
  setRefetchRelatedProjects,
  metaprojectData,
  ...rest
}: ProjectDataProps &
  ProjectFiles &
  TrancheErrors &
  FileMetaDataProps & {
    specificFields: ProjectSpecificFields[]
    mode: string
    postExComUpdate?: boolean
    approval?: boolean
    impact?: boolean
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
    setRefetchRelatedProjects?: (refetch: boolean) => void
    metaprojectData?: MetaProjectDetailType | null
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
  const [currentTab, setCurrentTab] = useState<number>(
    impact ? 3 : approval ? 5 : 0,
  )

  const areFieldsDisabled = !canLinkToBp || currentStep < 1
  const areNextSectionsDisabled = areFieldsDisabled || bpData.bpDataLoading
  const areProjectSpecificTabsDisabled =
    areNextSectionsDisabled || !project_type || !sector

  const [overviewFields, substanceDetailsFields, impactFields] = [
    getSectionFields(specificFields, 'Header'),
    getSectionFields(specificFields, 'Substance Details'),
    getSectionFields(specificFields, 'Impact'),
  ]
  const odsOdpFields = getOdsOdpFields(substanceDetailsFields)
  const odsDisplayField = getFieldData(odsOdpFields, 'ods_display_name')

  const { warnings } = useStore((state) => state.projectWarnings)
  const { projectFields, viewableFields, editableFields } = useStore(
    (state) => state.projectFields,
  )

  const groupField = getFieldData(overviewFields, 'group')
  const specificFieldsIdentifiers = 'projectSpecificFields'
  const specificFieldsData = projectData[specificFieldsIdentifiers] || []

  useEffect(() => {
    if (groupField) {
      const groupOptions = formatOptions(groupField, specificFieldsData)

      const validData = find(
        groupOptions,
        (option) => option.id === specificFieldsData.group,
      )

      if (!validData) {
        setProjectData((prevData) => ({
          ...prevData,
          [specificFieldsIdentifiers]: {
            ...prevData[specificFieldsIdentifiers],
            group: null,
          },
        }))
      }
    }
  }, [groupField])

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

  useEffect(() => {
    if (
      impact &&
      specificFieldsLoaded &&
      (impactFields.length < 1 ||
        !hasFields(projectFields, viewableFields, 'Impact'))
    ) {
      setCurrentTab(0)
    }
  }, [specificFieldsLoaded])

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

  const hasPostExcomMeetingErrors = getPostExcomMeetingErrors(projIdentifiers)
  const postExcomMeetingErrors = {
    post_excom_meeting:
      postExComUpdate &&
      !!projIdentifiers.post_excom_meeting &&
      hasPostExcomMeetingErrors
        ? ['Cannot be earlier than the original approval meeting.']
        : [],
  }

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
        true,
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
          ...getApprovalErrors(
            approvalData,
            crossCuttingFields,
            approvalFields,
            errors,
            project,
          ),
          ...approvalCrossCuttingErrors,
        }
      : postExComUpdate
        ? getPostExcomApprovalErrors(
            approvalData,
            approvalFields,
            errors,
            project,
          )
        : {}
  }, [
    approvalData,
    crossCuttingFields,
    approvalFields,
    errors,
    crossCuttingErrors,
  ])

  const { canEditApprovedProjects, canViewBp } = useContext(PermissionsContext)
  const hasV3EditPermissions =
    !!project && mode === 'edit' && canEditApprovedProjects
  const editableByAdmin = ['Approved', 'Withdrawn', 'Not approved'].includes(
    project?.submission_status ?? '',
  )
  const isV3ProjectEditable =
    hasV3EditPermissions &&
    (editableByAdmin || project.submission_status === 'Recommended')
  const disableV3Edit =
    !!project &&
    mode === 'edit' &&
    !postExComUpdate &&
    !project.editable &&
    project.editable_for_actual_fields

  const hasComponents =
    !!project &&
    project.component &&
    project.component.original_project_id === project.id

  const bpErrorMessage = 'A business plan activity should be selected.'
  const shouldValidateBp =
    canViewBp && mode === 'edit' && canEditField(editableFields, 'bp_activity')

  const hasBpDefaultErrors =
    shouldValidateBp && bpData.hasBpData && !bpLinking.bpId

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
  const allImpactErrors = specificFieldsErrors['Impact'] || {}

  const isActualFieldEmpty = ([key, value]: [string, string[]]) =>
    key.includes('(actual)') && value?.[0]?.includes('not completed')

  const impactErrors = Object.fromEntries(
    Object.entries(allImpactErrors).filter(
      (error) => !isActualFieldEmpty(error),
    ),
  )

  const { errorText, isError } = trancheErrors || {}

  const fieldsForValidation = map(odsOdpFields, 'write_field_name')
  const odsOdpData = projectSpecificFields?.ods_odp ?? []

  const errorMessageExtension =
    project?.submission_status === 'Draft' ? ' for submission' : ''

  const odsOpdDataErrors =
    odsOdpFields.length > 0
      ? map(odsOdpData, (odsOdp) => {
          const errors = map(fieldsForValidation, (field) =>
            mode === 'edit' && checkInvalidValue(odsOdp[field])
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

  const formatFieldName = (field: string) =>
    ['ods_substance_id', 'ods_blend_id'].includes(field)
      ? 'ods_display_name'
      : field

  const formattedOdsOdpErrors = map(
    filteredOdsOdpErrors,
    ({ id, ...fields }) => {
      const substanceNo = Number(id) + 1

      const fieldLabels = Object.entries(
        fields as Record<string, string[]>,
      ).filter(([_, errors]) => Array.isArray(errors) && errors.length > 0)

      if (fieldLabels.length === 0) return null

      const missingFields = fieldLabels
        .filter(([_, errors]) => errors[0] === 'This field is required.')
        .map(([field]) => getFieldLabel(specificFields, formatFieldName(field)))

      const invalidFields = fieldLabels
        .filter(([_, errors]) => errors[0] !== 'This field is required.')
        .map(([field]) => getFieldLabel(specificFields, formatFieldName(field)))

      const messages = [
        missingFields.length > 0
          ? `${missingFields.join(', ')}: ${
              missingFields.length > 1 ? 'These fields are' : 'This field is'
            } required${errorMessageExtension}.`
          : null,
        invalidFields.length > 0
          ? `${invalidFields.join(', ')}: ${
              invalidFields.length > 1 ? 'These fields are' : 'This field is'
            } not valid.`
          : null,
      ].filter(Boolean)

      const odsOdpType = odsDisplayField
        ? `Substance ${substanceNo}`
        : 'Phase out'

      return { message: `${odsOdpType} - ` + messages.join(' ') }
    },
  ).filter(Boolean)

  const odsOdpErrors = map(
    formattedOdsOdp as { [key: string]: [] }[],
    (error) =>
      mapKeys(error, (_, key) =>
        getFieldLabel(specificFields, formatFieldName(key)),
      ),
  )

  const hasNoFiles =
    loadedFiles &&
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
                hasSectionErrors(postExcomMeetingErrors) ||
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
          errors={{ ...projIdentifiersErrors, ...postExcomMeetingErrors }}
          bpErrors={allBpErrors}
        />
      ),
      errors: [
        ...formatErrors({
          ...projIdentifiersErrors,
          ...postExcomMeetingErrors,
          ...bpErrors,
        }),
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
            disableV3Edit,
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
          nextStep={!isSpecificInfoTabDisabled ? 3 : 2}
          {...{ projectData, setProjectData, setCurrentTab }}
        />
      ),
      errors: formatErrors(impactErrors),
    },
    {
      id: 'project-documentation-section',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Attachments</div>
          {mode !== 'add' && !loadedFiles ? (
            LoadingTab
          ) : fileErrors || hasNoFiles || missingFileTypeErrors.length > 0 ? (
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
            disableV3Edit,
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
        ...(hasNoFiles
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
                  setRefetchRelatedProjects,
                  setCurrentTab,
                  metaprojectData,
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
      <div className="flex items-center justify-between">
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
        {mode === 'edit' &&
          project?.submission_status === 'Draft' &&
          project?.version === 1 &&
          project?.editable && (
            <ProjectDelete {...{ project, hasComponents }} />
          )}
      </div>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {steps
          .filter((_, index) => index === currentTab)
          .map(({ id, component, errors }) => {
            return (
              <span key={id}>
                {isEditMode &&
                  project.submission_status === 'Draft' &&
                  !canEditApprovedProjects &&
                  currentTab === 0 && (
                    <CustomAlert
                      type="info"
                      alertClassName="mb-3"
                      content={
                        <Typography className="text-lg leading-5">
                          {project.version === 2
                            ? 'The Identifiers fields cannot be edited anymore. If there was a mistake in completing them, the project needs to be resubmitted with the correct information.'
                            : "After the project's submission, the Identifiers fields cannot be further edited. Any mistake in completing them will require the project to be resubmitted with the correct information."}
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
                        <Typography className="text-lg leading-5">
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
                        <Typography component="div">
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
