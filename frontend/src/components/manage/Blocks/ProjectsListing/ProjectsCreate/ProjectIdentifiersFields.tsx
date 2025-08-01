import { ChangeEvent, useContext, useState } from 'react'

import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
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
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { changeHandler } from './SpecificFieldsHelpers'
import { ClosedList, OpenedList } from '../HelperComponents'
import { defaultProps, disabledClassName, tableColumns } from '../constants'
import { canEditField, canViewField, getProduction } from '../utils'
import { ApiAgency } from '@ors/types/api_agencies'
import { Cluster, Country } from '@ors/types/store'
import { parseNumber } from '@ors/helpers'
import { useStore } from '@ors/store'

import { Alert, Button, Checkbox, FormControlLabel } from '@mui/material'
import { IoInformationCircleOutline } from 'react-icons/io5'
import { find, isNil, isNull, map } from 'lodash'
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
  relatedProjects,
}: ProjectIdentifiersSectionProps) => {
  const sectionIdentifier = 'projIdentifiers'
  const projIdentifiers = projectData[sectionIdentifier]

  const [openComponentProjects, setOpenComponentProjects] = useState(true)
  const [openAssociatedProjects, setOpenAssociatedProjects] = useState(true)

  const commonSlice = useStore((state) => state.common)
  const agencies = commonSlice.agencies.data

  const projectSlice = useStore((state) => state.projects)
  const crtClusters = projectSlice.clusters.data
  const { clusters: allClusters } = useContext(ProjectsDataContext)
  const clusters = mode === 'edit' ? allClusters : crtClusters

  const canUpdateLeadAgency = mode === 'add' || mode === 'copy'

  const { viewableFields, editableFields } = useStore(
    (state) => state.projectFields,
  )

  const canEditMeeting = canEditField(editableFields, 'meeting')

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
      <SectionTitle>Identifiers</SectionTitle>
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
                  mode === 'partial-link' ||
                  mode === 'full-link' ||
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
                typography: { fontSize: '1.05rem' },
              }}
            />
          )}
        </div>
        {canViewField(viewableFields, 'lead_agency_submitting_on_behalf') && (
          <FormControlLabel
            className="w-fit"
            label="Confirm you are the lead agency submitting on behalf of a cooperating agency."
            control={
              <Checkbox
                checked={projIdentifiers?.lead_agency_submitting_on_behalf}
                disabled={
                  !canUpdateLeadAgency ||
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
        {canViewField(viewableFields, 'lead_agency') && (
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
                !canUpdateLeadAgency ||
                !areNextSectionsDisabled ||
                !canEditField(editableFields, 'lead_agency')
              }
              Input={{
                error: getIsInputDisabled('lead_agency'),
              }}
              {...sectionDefaultProps}
            />
            {canUpdateLeadAgency && (
              <Alert
                className="mt-2 w-fit bg-mlfs-bannerColor px-2 py-0"
                icon={<IoInformationCircleOutline size={20} />}
                severity="info"
              >
                When submitting on behalf of a cooperating agency, selecting
                either the agency or the lead agency will automatically update
                the other.
              </Alert>
            )}
          </>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <NavigationButton
            isBtnDisabled={!isNextBtnEnabled}
            setCurrentStep={setCurrentStep}
            direction="next"
            classname={
              'h-8 leading-none ' +
              (isNextBtnEnabled
                ? 'border-secondary !bg-secondary text-white hover:border-primary hover:!bg-primary hover:text-mlfs-hlYellow'
                : '')
            }
          />
          {!areNextSectionsDisabled && (
            <div className="mt-5">
              <Button
                className="h-8 border border-solid border-primary bg-white px-3 py-1 leading-none text-primary"
                size="large"
                variant="contained"
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
      {/* {map(
        relatedProjects,
        ({ data, title }, index) =>
          data &&
          data.length > 0 && (
            <div
              className="transition-transform mt-6 w-full max-w-[850px] transform cursor-pointer rounded-lg p-4 duration-300 ease-in-out"
              style={{ boxShadow: '0px 10px 20px 0px rgba(0, 0, 0, 0.2)' }}
              onClick={() => {
                if (index === 0) {
                  setOpenComponentProjects(!openComponentProjects)
                } else {
                  setOpenAssociatedProjects(!openAssociatedProjects)
                }
              }}
            >
              {(index === 0 && openComponentProjects) ||
              (index === 1 && openAssociatedProjects) ? (
                <OpenedList
                  title={title}
                  data={data}
                  canRefreshStatus={false}
                  loaded={true}
                  mode="view"
                />
              ) : (
                <ClosedList title={title} />
              )}
            </div>
          ),
      )} */}
    </>
  )
}

export default ProjectIdentifiersFields
