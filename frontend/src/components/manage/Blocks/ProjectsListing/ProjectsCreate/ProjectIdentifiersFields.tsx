import { ChangeEvent, useContext } from 'react'

import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { NavigationButton } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/NavigationButton'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { SectionTitle } from './ProjectsCreate'
import {
  ProjectData,
  ProjectIdentifiersSectionProps,
  ProjIdentifiers,
} from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import {
  getMeetingNr,
  getMeetingOptions,
} from '@ors/components/manage/Utils/utilFunctions'
import CustomAlert from '@ors/components/theme/Alerts/CustomAlert'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { changeHandler } from './SpecificFieldsHelpers'
import {
  defaultProps,
  defaultPropsSimpleField,
  disabledClassName,
  tableColumns,
} from '../constants'
import {
  canEditField,
  canViewField,
  filterClusterOptions,
  getProduction,
} from '../utils'
import { ApiAgency } from '@ors/types/api_agencies'
import { Cluster, Country } from '@ors/types/store'
import { parseNumber } from '@ors/helpers'
import { useStore } from '@ors/store'

import { Button, Checkbox, FormControlLabel, Typography } from '@mui/material'
import { find, isNil, isNull } from 'lodash'
import cx from 'classnames'

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
  specificFieldsLoaded,
}: ProjectIdentifiersSectionProps) => {
  const sectionIdentifier = 'projIdentifiers'
  const projIdentifiers = projectData[sectionIdentifier]

  const { canViewProductionProjects } = useContext(PermissionsContext)

  const commonSlice = useStore((state) => state.common)
  const agencies = commonSlice.agencies.data

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

  const canUpdateLeadAgency =
    mode === 'add' || mode === 'copy' || !project?.meta_project?.lead_agency

  const { viewableFields, editableFields } = useStore(
    (state) => state.projectFields,
  )
  const canEditMeeting =
    !postExComUpdate && canEditField(editableFields, 'meeting')

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
        is_lvc:
          find(commonSlice.countries.data, { id: country?.id })?.is_lvc ?? null,
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
      },
    }))
  }

  const handleChangePostExComDecision = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const initialValue = event.target.value

    if (initialValue === '' || !isNaN(parseInt(initialValue))) {
      const finalVal = initialValue ? parseInt(initialValue).toString() : null

      setProjectData((prevData) => ({
        ...prevData,
        [sectionIdentifier]: {
          ...prevData[sectionIdentifier],
          post_excom_decision: finalVal,
        },
      }))
    } else {
      event.preventDefault()
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
                  options={getMeetingOptions()}
                  onChange={handleChangePostExComMeeting}
                  onClear={() => handleChangePostExComMeeting()}
                  clearBtnClassName="right-1"
                  withClear={true}
                  className="!m-0 h-10 !py-1"
                />
              </div>
              <div className="w-32">
                <Label htmlFor="postExComDecision">Decision</Label>
                <SimpleInput
                  id="postExComDecision"
                  value={projIdentifiers?.post_excom_decision ?? ''}
                  onChange={handleChangePostExComDecision}
                  type="text"
                  className={defaultPropsSimpleField.className}
                  containerClassName={
                    defaultPropsSimpleField.containerClassName
                  }
                />
              </div>
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
              <Field
                widget="autocomplete"
                options={commonSlice.countries.data}
                value={projIdentifiers?.country}
                onChange={(_, value) => handleChangeCountry(value)}
                getOptionLabel={(option) =>
                  getOptionLabel(commonSlice.countries.data, option)
                }
                disabled={
                  !areNextSectionsDisabled ||
                  (mode !== 'copy' && !!project?.country_id) ||
                  !canEditField(editableFields, 'country')
                }
                Input={{
                  error: getIsInputDisabled('country'),
                }}
                {...sectionDefaultProps}
              />
            </div>
          )}
          {canViewField(viewableFields, 'meeting') && (
            <div className="w-32">
              <Label>{tableColumns.meeting}</Label>
              <PopoverInput
                label={getMeetingNr(
                  projIdentifiers?.meeting ?? undefined,
                )?.toString()}
                options={getMeetingOptions()}
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
          )}
          {canViewField(viewableFields, 'agency') && (
            <div>
              <Label>{tableColumns.agency}</Label>
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
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-x-20 gap-y-3">
          {canViewField(viewableFields, 'cluster') && (
            <div>
              <Label>{tableColumns.cluster}</Label>
              <Field
                widget="autocomplete"
                options={crtClusters}
                value={projIdentifiers?.cluster}
                onChange={(_, value) => handleChangeCluster(value)}
                getOptionLabel={(option) => getOptionLabel(clusters, option)}
                disabled={
                  !areNextSectionsDisabled ||
                  !specificFieldsLoaded ||
                  !canEditField(editableFields, 'cluster')
                }
                Input={{
                  error: getIsInputDisabled('cluster'),
                }}
                {...defaultProps}
                FieldProps={{
                  className: defaultProps.FieldProps.className + ' w-[20rem]',
                }}
              />
            </div>
          )}
          {canViewField(viewableFields, 'production') && (
            <FormControlLabel
              className="w-fit self-end"
              label="Production"
              control={
                <Checkbox
                  checked={!!projIdentifiers?.production}
                  disabled={
                    !areNextSectionsDisabled ||
                    !canViewProductionProjects ||
                    !isNull(getProduction(clusters, projIdentifiers.cluster)) ||
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
                typography: { fontSize: '1.05rem', marginTop: '2px' },
              }}
            />
          )}
        </div>
        {canViewField(viewableFields, 'lead_agency_submitting_on_behalf') &&
          canUpdateLeadAgency && (
            <FormControlLabel
              className="w-fit"
              label="Confirm you are the lead agency submitting on behalf of a cooperating agency."
              control={
                <Checkbox
                  checked={projIdentifiers?.lead_agency_submitting_on_behalf}
                  disabled={
                    !areNextSectionsDisabled ||
                    !canEditField(
                      editableFields,
                      'lead_agency_submitting_on_behalf',
                    )
                  }
                  onChange={handleChangeSubmitOnBehalf}
                  size="small"
                  sx={{
                    color: 'black',
                  }}
                />
              }
              componentsProps={{
                typography: { fontSize: '1.05rem' },
              }}
            />
          )}
        {canViewField(viewableFields, 'lead_agency') && canUpdateLeadAgency && (
          <>
            <Label>{tableColumns.lead_agency}</Label>
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
                !canEditField(editableFields, 'lead_agency')
              }
              Input={{
                error: getIsInputDisabled('lead_agency'),
              }}
              {...sectionDefaultProps}
            />
            {canUpdateLeadAgency && (
              <CustomAlert
                type="info"
                alertClassName="mt-2 px-2 py-0"
                content={
                  <Typography className="pt-0.5 text-lg leading-none">
                    Unless submitting on behalf of a cooperating agency,
                    selecting either the agency or the lead agency will
                    automatically update the other.
                  </Typography>
                }
              />
            )}
          </>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <NavigationButton
            isBtnDisabled={!areNextStepsAvailable}
            setCurrentStep={setCurrentStep}
            direction="next"
            classname={
              'h-8 leading-none ' +
              (areNextStepsAvailable
                ? 'border-secondary !bg-secondary text-white hover:border-primary hover:!bg-primary hover:text-mlfs-hlYellow'
                : '')
            }
          />
          {!areNextSectionsDisabled && (
            <div className="mt-5">
              <Button
                className={cx(
                  'h-8 border border-solid border-primary bg-white px-3 py-1 leading-none text-primary',
                  {
                    [disabledClassName]: postExComUpdate,
                  },
                )}
                size="large"
                variant="contained"
                disabled={postExComUpdate}
                onClick={() => {
                  setCurrentStep(0)
                  setCurrentTab(0)
                }}
              >
                Update fields
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ProjectIdentifiersFields
