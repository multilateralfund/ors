import { ChangeEvent } from 'react'

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
import { changeHandler } from './SpecificFieldsHelpers'
import { defaultProps, tableColumns } from '../constants'

import { useStore } from '@ors/store'
import { Country } from '@ors/types/store'
import { parseNumber } from '@ors/helpers'

import { Button, Checkbox, FormControlLabel } from '@mui/material'
import { find, filter } from 'lodash'
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
}: ProjectIdentifiersSectionProps) => {
  const sectionIdentifier = 'projIdentifiers'
  const projIdentifiers = projectData[sectionIdentifier]

  const commonSlice = useStore((state) => state.common)
  const projectSlice = useStore((state) => state.projects)
  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data

  const agencyOptions = filter(
    commonSlice.agencies.data,
    (agency) => agency.id !== projIdentifiers.side_agency,
  )
  const leadAgencyOptions = filter(
    commonSlice.agencies.data,
    (agency) => agency.id !== projIdentifiers.current_agency,
  )

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

  const handleChangeMeeting = (meeting?: string) => {
    setProjectData((prevData) => ({
      ...prevData,
      [sectionIdentifier]: {
        ...prevData[sectionIdentifier],
        meeting: parseNumber(meeting),
      },
    }))
  }

  const handleChangeIsLeadAgency = (event: ChangeEvent<HTMLInputElement>) => {
    setProjectData((prevData) => ({
      ...prevData,
      [sectionIdentifier]: {
        ...prevData[sectionIdentifier],
        is_lead_agency: event.target.checked,
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
                mode === 'full-link'
              }
              Input={{
                error: getIsInputDisabled('country'),
              }}
              {...sectionDefaultProps}
            />
          </div>
          <div className="w-32">
            <Label>{tableColumns.meeting}</Label>
            <PopoverInput
              label={getMeetingNr(
                projIdentifiers?.meeting ?? undefined,
              )?.toString()}
              options={getMeetingOptions()}
              onChange={handleChangeMeeting}
              onClear={() => handleChangeMeeting()}
              className={cx('!m-0 h-10 !py-1', {
                'border-red-500': getIsInputDisabled('meeting'),
              })}
              clearBtnClassName="right-1"
              withClear={true}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-20 gap-y-3">
          <div>
            <Label>{tableColumns.agency}</Label>
            <Field
              widget="autocomplete"
              options={agencyOptions}
              value={projIdentifiers?.current_agency}
              onChange={(_, value) =>
                changeHandler['drop_down']<ProjectData, ProjIdentifiers>(
                  value,
                  'current_agency',
                  setProjectData,
                  sectionIdentifier,
                )
              }
              getOptionLabel={(option) => getOptionLabel(agencyOptions, option)}
              disabled={!!agency_id || !areNextSectionsDisabled}
              Input={{
                error:
                  projIdentifiers.is_lead_agency &&
                  getIsInputDisabled('agency'),
              }}
              {...sectionDefaultProps}
            />
          </div>
          <div>
            <Label>{tableColumns.cluster}</Label>
            <Field
              widget="autocomplete"
              options={projectSlice.clusters.data}
              value={projIdentifiers?.cluster}
              onChange={(_, value) =>
                changeHandler['drop_down']<ProjectData, ProjIdentifiers>(
                  value,
                  'cluster',
                  setProjectData,
                  sectionIdentifier,
                )
              }
              getOptionLabel={(option) =>
                getOptionLabel(projectSlice.clusters.data, option)
              }
              disabled={!areNextSectionsDisabled}
              Input={{
                error: getIsInputDisabled('cluster'),
              }}
              {...defaultProps}
              FieldProps={{
                className: defaultProps.FieldProps.className + ' w-[20rem]',
              }}
            />
          </div>
        </div>
        <FormControlLabel
          className="w-fit"
          label="Confirm you are the lead agency submitting on behalf of a cooperating agency."
          control={
            <Checkbox
              checked={projIdentifiers?.is_lead_agency}
              disabled={!areNextSectionsDisabled}
              onChange={handleChangeIsLeadAgency}
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
        {!projIdentifiers.is_lead_agency && (
          <>
            <Label>Lead agency</Label>
            <Field
              widget="autocomplete"
              options={leadAgencyOptions}
              value={projIdentifiers?.side_agency}
              onChange={(_, value) =>
                changeHandler['drop_down']<ProjectData, ProjIdentifiers>(
                  value,
                  'side_agency',
                  setProjectData,
                  sectionIdentifier,
                )
              }
              getOptionLabel={(option) =>
                getOptionLabel(leadAgencyOptions, option)
              }
              disabled={!areNextSectionsDisabled}
              Input={{
                error:
                  !projIdentifiers.is_lead_agency &&
                  getIsInputDisabled('agency'),
              }}
              {...sectionDefaultProps}
            />
          </>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <NavigationButton
            isBtnDisabled={!isNextBtnEnabled}
            setCurrentStep={setCurrentStep}
            // setCurrentTab={setCurrentTab}
            direction={'next'}
          />
          {!areNextSectionsDisabled && (
            <div className="mt-5">
              <Button
                className="h-10 border border-solid border-primary bg-white px-3 py-1 text-primary"
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
    </>
  )
}

export default ProjectIdentifiersFields
