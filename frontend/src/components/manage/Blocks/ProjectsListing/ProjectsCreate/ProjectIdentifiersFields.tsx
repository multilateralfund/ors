import { ChangeEvent, useContext, useMemo } from 'react'

import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { SectionTitle } from './ProjectsCreate'
import {
  ProjectData,
  ProjectIdentifiersSectionProps,
  ProjIdentifiers,
} from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import {
  getMeetingNr,
  useMeetingOptions,
} from '@ors/components/manage/Utils/utilFunctions'
import CustomAlert from '@ors/components/theme/Alerts/CustomAlert'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { FieldErrorIndicator, NavigationButton } from '../HelperComponents'
import { changeHandler } from './SpecificFieldsHelpers'
import { defaultProps, disabledClassName, tableColumns } from '../constants'
import {
  canEditField,
  canViewField,
  filterClusterOptions,
  getAgencyErrorType,
  getProduction,
} from '../utils'
import useApi from '@ors/hooks/useApi.ts'
import { ApiDecision } from '@ors/types/api_meetings.ts'
import { ApiAgency } from '@ors/types/api_agencies'
import { Cluster, Country } from '@ors/types/store'
import { parseNumber } from '@ors/helpers'
import { useStore } from '@ors/store'

import { Button, Checkbox, FormControlLabel, Typography } from '@mui/material'
import { find, isNil, isNull, map } from 'lodash'
import cx from 'classnames'

type DecisionOption = {
  name: string
  value: number
}

const ProjectIdentifiersFields = ({
  projectData,
  setProjectData,
  isNextBtnEnabled,
  areNextSectionsDisabled,
  setCurrentStep,
  setCurrentTab,
  errors,
  hasSubmitted,
  mode,
  project,
  postExComUpdate,
  isV3ProjectEditable,
  specificFieldsLoaded,
}: ProjectIdentifiersSectionProps) => {
  const sectionIdentifier = 'projIdentifiers'
  const projIdentifiers = projectData[sectionIdentifier]
  const { project_type, sector } = projectData.crossCuttingFields

  const { canViewProductionProjects } = useContext(PermissionsContext)
  const { countries, agencies } = useContext(ProjectsDataContext)

  const projectSlice = useStore((state) => state.projects)
  const crtClusters = filterClusterOptions(
    projectSlice.clusters.data,
    canViewProductionProjects,
  )
  const { clusters: allClusters } = useContext(ProjectsDataContext)
  const clusters =
    mode === 'edit'
      ? filterClusterOptions(allClusters, canViewProductionProjects)
      : crtClusters

  const isV3Project = postExComUpdate || isV3ProjectEditable
  const isAddOrCopy = mode === 'add' || mode === 'copy'
  const hasNoLeadAgency = !project?.lead_agency
  const isApproved = project?.submission_status === 'Approved'
  const canUpdateLeadAgency =
    (!isV3Project && (isAddOrCopy || (!isApproved && hasNoLeadAgency))) ||
    (isV3Project && hasNoLeadAgency)

  const { viewableFields, editableFields } = useStore(
    (state) => state.projectFields,
  )

  const canEditMeeting =
    isAddOrCopy ||
    (mode === 'edit' &&
      (!project?.component ||
        project?.id === project?.component?.original_project_id) &&
      (project?.submission_status === 'Withdrawn' || project?.version === 1))

  const decisionsApi = useApi<ApiDecision[]>({
    path: 'api/decisions',
    options: {
      triggerIf: !!projIdentifiers?.post_excom_meeting,
      params: {
        meeting_id: projIdentifiers?.post_excom_meeting,
      },
    },
  })

  const decisionOptions = useMemo(() => {
    const data = decisionsApi.data ?? ([] as ApiDecision[])
    return map(data, (d) => ({ name: d.number, value: d.id }))
  }, [decisionsApi.data])

  const areNextStepsAvailable = isNextBtnEnabled && areNextSectionsDisabled

  const sectionDefaultProps = {
    ...defaultProps,
    FieldProps: {
      className: defaultProps.FieldProps.className + ' w-[16rem]',
    },
  }

  const handleChangeCountry = (country: Country) => {
    changeHandler['drop_down']<ProjectData, ProjIdentifiers>(
      country,
      'country',
      setProjectData,
      sectionIdentifier,
    )

    setProjectData((prevData) => ({
      ...prevData,
      crossCuttingFields: {
        ...prevData.crossCuttingFields,
        is_lvc: find(countries, { id: country?.id })?.is_lvc ?? null,
      },
    }))
  }

  const handleChangeAgency = (value: ApiAgency | null) => {
    changeHandler['drop_down']<ProjectData, ProjIdentifiers>(
      value,
      'agency',
      setProjectData,
      sectionIdentifier,
    )
  }

  const handleChangeLeadAgency = (value: ApiAgency | null) => {
    changeHandler['drop_down']<ProjectData, ProjIdentifiers>(
      value,
      'lead_agency',
      setProjectData,
      sectionIdentifier,
    )
  }

  const handleChangeCluster = (cluster: Cluster) => {
    changeHandler['drop_down']<ProjectData, ProjIdentifiers>(
      cluster,
      'cluster',
      setProjectData,
      sectionIdentifier,
    )

    const isProduction = getProduction(crtClusters, cluster?.id)

    setProjectData((prevData) => ({
      ...prevData,
      [sectionIdentifier]: {
        ...prevData[sectionIdentifier],
        production: !isNil(isProduction) ? isProduction : false,
      },
    }))
  }

  const handleChangeProduction = (event: ChangeEvent<HTMLInputElement>) => {
    setProjectData((prevData) => ({
      ...prevData,
      [sectionIdentifier]: {
        ...prevData[sectionIdentifier],
        production: event.target.checked,
      },
    }))
  }

  const handleChangeMeeting = (meeting?: string) => {
    setProjectData((prevData) => ({
      ...prevData,
      [sectionIdentifier]: {
        ...prevData[sectionIdentifier],
        meeting: parseNumber(meeting),
      },
    }))
  }

  const handleChangePostExComMeeting = (meeting?: string) => {
    setProjectData((prevData) => ({
      ...prevData,
      [sectionIdentifier]: {
        ...prevData[sectionIdentifier],
        post_excom_meeting: parseNumber(meeting),
        ...(parseNumber(meeting) !== projIdentifiers?.post_excom_meeting
          ? { post_excom_decision: null }
          : {}),
      },
    }))
    decisionsApi.setParams({ meeting_id: meeting })
    decisionsApi.setApiSettings((prev) => ({
      ...prev,
      options: { ...prev.options, triggerIf: !!meeting },
    }))
  }

  const handleChangePostExComDecision = (
    option: DecisionOption | string | null,
  ) => {
    const initialValue =
      typeof option === 'string' ? option : (option?.value.toString() ?? '')

    if (initialValue === '' || !isNaN(parseInt(initialValue))) {
      const finalVal = initialValue ? parseInt(initialValue) : null

      setProjectData((prevData) => ({
        ...prevData,
        [sectionIdentifier]: {
          ...prevData[sectionIdentifier],
          post_excom_decision: finalVal,
        },
      }))
    }
  }

  const handleChangeSubmitOnBehalf = (event: ChangeEvent<HTMLInputElement>) => {
    setProjectData((prevData) => ({
      ...prevData,
      [sectionIdentifier]: {
        ...prevData[sectionIdentifier],
        lead_agency_submitting_on_behalf: event.target.checked,
      },
    }))
  }

  const getIsInputDisabled = (field: keyof typeof errors) =>
    hasSubmitted && errors[field]?.length > 0

  return (
    <>
      {postExComUpdate ? (
        <div>
          <SectionTitle>
            Update Project fields following Executive Committee
          </SectionTitle>
          <div className="flex flex-col gap-y-2">
            <div className="flex flex-wrap gap-x-20 gap-y-3">
              <div className="w-32">
                <Label>Meeting</Label>
                <PopoverInput
                  label={getMeetingNr(
                    projIdentifiers?.post_excom_meeting ?? undefined,
                  )?.toString()}
                  options={useMeetingOptions()}
                  onChange={handleChangePostExComMeeting}
                  onClear={() => handleChangePostExComMeeting()}
                  clearBtnClassName="right-1"
                  withClear={true}
                  className="!m-0 h-10 !py-1"
                />
              </div>
              <div className="w-[16rem]">
                <Label htmlFor="postExComDecision">Decision</Label>
                <Field<any>
                  widget="autocomplete"
                  options={decisionOptions}
                  value={projIdentifiers?.post_excom_decision ?? null}
                  onChange={(_, value) =>
                    handleChangePostExComDecision(value as DecisionOption)
                  }
                  getOptionLabel={(option) => {
                    return getOptionLabel(decisionOptions, option, 'value')
                  }}
                  {...sectionDefaultProps}
                />
              </div>
              {!(
                projIdentifiers?.post_excom_meeting &&
                projIdentifiers?.post_excom_decision
              ) && (
                <div className="flex items-end">
                  <div className="flex h-10 items-center">
                    <CustomAlert
                      type="error"
                      content={
                        <>
                          <Typography className="text-lg">
                            These fields are mandatory.
                          </Typography>
                        </>
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <br />
        </div>
      ) : null}
      <SectionTitle>
        {postExComUpdate ? 'Main attributes' : 'Identifiers'}
      </SectionTitle>
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-wrap gap-x-20 gap-y-3">
          {canViewField(viewableFields, 'country') && (
            <div>
              <Label>{tableColumns.country}</Label>
              <div className="flex items-center">
                <Field
                  widget="autocomplete"
                  options={countries}
                  value={projIdentifiers?.country}
                  onChange={(_, value) => handleChangeCountry(value)}
                  getOptionLabel={(option) => getOptionLabel(countries, option)}
                  disabled={!isAddOrCopy || !areNextSectionsDisabled}
                  Input={{
                    error: getIsInputDisabled('country'),
                  }}
                  {...sectionDefaultProps}
                />
                <FieldErrorIndicator errors={errors} field="country" />
              </div>
            </div>
          )}
          <div>
            <Label>{tableColumns.meeting}</Label>
            <div className="flex items-center">
              <div className="w-32">
                <PopoverInput
                  label={getMeetingNr(
                    projIdentifiers?.meeting ?? undefined,
                  )?.toString()}
                  options={useMeetingOptions()}
                  onChange={handleChangeMeeting}
                  onClear={() => handleChangeMeeting()}
                  disabled={!canEditMeeting}
                  className={cx('!m-0 h-10 !py-1', {
                    'border-red-500': getIsInputDisabled('meeting'),
                    [disabledClassName]: !canEditMeeting,
                  })}
                  clearBtnClassName="right-1"
                  withClear={canEditMeeting}
                />
              </div>
              <FieldErrorIndicator errors={errors} field="meeting" />
            </div>
          </div>
          {canViewField(viewableFields, 'agency') && (
            <div>
              <Label>{tableColumns.agency}</Label>
              <div className="flex items-center">
                <Field
                  widget="autocomplete"
                  options={agencies}
                  value={projIdentifiers?.agency}
                  onChange={(_, value) => {
                    handleChangeAgency(value)

                    if (
                      canUpdateLeadAgency &&
                      !projIdentifiers.lead_agency_submitting_on_behalf
                    ) {
                      handleChangeLeadAgency(value)
                    }
                  }}
                  getOptionLabel={(option) => getOptionLabel(agencies, option)}
                  disabled={
                    !areNextSectionsDisabled ||
                    !canEditField(editableFields, 'agency')
                  }
                  Input={{
                    error: getIsInputDisabled('agency'),
                  }}
                  {...sectionDefaultProps}
                />
                <FieldErrorIndicator errors={errors} field="agency" />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-x-20 gap-y-3">
          {canViewField(viewableFields, 'cluster') && (
            <div>
              <Label>{tableColumns.cluster}</Label>
              <div className="flex items-center">
                <div className="w-[20rem] flex-shrink">
                  <Field
                    widget="autocomplete"
                    options={crtClusters}
                    value={projIdentifiers?.cluster}
                    onChange={(_, value) => handleChangeCluster(value)}
                    getOptionLabel={(option) =>
                      getOptionLabel(clusters, option)
                    }
                    disabled={
                      (isV3Project && !!project?.cluster_id) ||
                      !areNextSectionsDisabled ||
                      !specificFieldsLoaded ||
                      !canEditField(editableFields, 'cluster')
                    }
                    Input={{
                      error: getIsInputDisabled('cluster'),
                    }}
                    {...defaultProps}
                    FieldProps={{
                      className: defaultProps.FieldProps.className + ' w-full',
                    }}
                  />
                </div>
                <FieldErrorIndicator errors={errors} field="cluster" />
              </div>
            </div>
          )}
          {canViewField(viewableFields, 'production') && (
            <div className="flex items-center self-end">
              <FormControlLabel
                className="w-fit"
                label="Production"
                control={
                  <Checkbox
                    checked={!!projIdentifiers?.production}
                    disabled={
                      (isV3Project && !!project?.cluster_id) ||
                      !areNextSectionsDisabled ||
                      !canViewProductionProjects ||
                      !isNull(
                        getProduction(clusters, projIdentifiers.cluster),
                      ) ||
                      !canEditField(editableFields, 'production')
                    }
                    onChange={handleChangeProduction}
                    size="small"
                    sx={{
                      color: 'black',
                    }}
                  />
                }
                componentsProps={{
                  typography: { fontSize: '1rem', marginTop: '2px' },
                }}
              />
              <FieldErrorIndicator errors={errors} field="production" />
            </div>
          )}
        </div>
        {canViewField(viewableFields, 'lead_agency_submitting_on_behalf') && (
          <div className="flex items-center">
            <FormControlLabel
              className="w-fit"
              label="Confirm you are the lead agency submitting on behalf of a cooperating agency."
              control={
                <Checkbox
                  checked={projIdentifiers?.lead_agency_submitting_on_behalf}
                  disabled={
                    !areNextSectionsDisabled ||
                    (isV3Project && project && !getAgencyErrorType(project)) ||
                    !canEditField(
                      editableFields,
                      'lead_agency_submitting_on_behalf',
                    )
                  }
                  onChange={handleChangeSubmitOnBehalf}
                  size="small"
                  sx={{ color: 'black' }}
                />
              }
              componentsProps={{ typography: { fontSize: '1rem' } }}
            />
            <FieldErrorIndicator
              errors={errors}
              field="lead_agency_submitting_on_behalf"
            />
          </div>
        )}
        {canViewField(viewableFields, 'lead_agency') && (
          <>
            <Label>{tableColumns.lead_agency}</Label>
            <div className="flex items-center">
              <Field
                widget="autocomplete"
                options={agencies}
                value={projIdentifiers?.lead_agency}
                onChange={(_, value) => {
                  handleChangeLeadAgency(value)

                  if (!projIdentifiers.lead_agency_submitting_on_behalf) {
                    handleChangeAgency(value)
                  }
                }}
                getOptionLabel={(option) => getOptionLabel(agencies, option)}
                disabled={
                  !areNextSectionsDisabled ||
                  !canUpdateLeadAgency ||
                  !canEditField(editableFields, 'lead_agency')
                }
                Input={{
                  error: getIsInputDisabled('lead_agency'),
                }}
                {...sectionDefaultProps}
              />
              <FieldErrorIndicator errors={errors} field="lead_agency" />
            </div>
            {canUpdateLeadAgency && (
              <CustomAlert
                type="info"
                alertClassName="mt-2 px-2 py-0"
                content={
                  <Typography className="text-lg leading-5">
                    Unless submitting on behalf of a cooperating agency,
                    selecting either the agency or the lead agency will
                    automatically update the other.
                  </Typography>
                }
              />
            )}
          </>
        )}
        {(mode === 'copy' ||
          (isV3Project && areNextSectionsDisabled) ||
          !(isV3Project || project?.submission_status === 'Approved')) && (
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <NavigationButton
              nextStep={project_type && sector ? 5 : 2}
              setCurrentStep={setCurrentStep}
              isBtnDisabled={!areNextStepsAvailable}
            />
            {!areNextSectionsDisabled && (
              <Button
                className="h-8 border border-solid border-primary bg-white px-3 py-1 leading-none text-primary"
                size="large"
                variant="contained"
                onClick={() => {
                  setCurrentStep?.(0)
                  setCurrentTab?.(0)
                }}
              >
                Update fields
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default ProjectIdentifiersFields
