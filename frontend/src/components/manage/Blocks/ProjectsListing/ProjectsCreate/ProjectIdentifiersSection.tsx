import { ChangeEvent } from 'react'

import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { NavigationButton } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/NavigationButton'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import {
  getMeetingNr,
  getMeetingOptions,
} from '@ors/components/manage/Utils/utilFunctions'
import { defaultProps, tableColumns } from '../constants'

import { useStore } from '@ors/store'

import { Button, Checkbox, FormControlLabel } from '@mui/material'
import { find, filter } from 'lodash'

const ProjectIdentifiersSection = ({
  projIdentifiers,
  setProjIdentifiers,
  setCrossCuttingFields,
  isNextBtnEnabled,
  areNextSectionsDisabled,
  isSubmitSuccessful,
  setCurrentStep,
  setCurrentTab,
}: any) => {
  const commonSlice = useStore((state) => state.common)
  const projectSlice = useStore((state) => state.projects)

  const agencyOptions = filter(
    commonSlice.agencies.data,
    (agency) => agency.id !== projIdentifiers.side_agency,
  )
  const leadAgencyOptions = filter(
    commonSlice.agencies.data,
    (agency) => agency.id !== projIdentifiers.current_agency,
  )

  const handleChangeCountry = (country: any) => {
    setProjIdentifiers((prevFilters: any) => ({
      ...prevFilters,
      country: country?.id ?? null,
    }))

    setCrossCuttingFields((prevFilters: any) => ({
      ...prevFilters,
      is_lvc: find(commonSlice.countries.data, { id: country?.id })?.is_lvc,
    }))
  }

  const handleChangeMeeting = (meeting: string) => {
    setProjIdentifiers((prevFilters: any) => ({
      ...prevFilters,
      meeting,
    }))
  }

  const handleChangeCluster = (cluster: any) => {
    setProjIdentifiers((prevFilters: any) => ({
      ...prevFilters,
      cluster: cluster?.id ?? null,
    }))
  }

  const handleChangeIsLeadAgency = (event: ChangeEvent<HTMLInputElement>) => {
    setProjIdentifiers((prevFilters: any) => ({
      ...prevFilters,
      is_lead_agency: event.target.checked,
    }))
  }

  const handleChangeCurrentAgency = (agency: any) => {
    setProjIdentifiers((prevFilters: any) => ({
      ...prevFilters,
      current_agency: agency?.id ?? null,
    }))
  }

  const handleChangeSideAgency = (agency: any) => {
    setProjIdentifiers((prevFilters: any) => ({
      ...prevFilters,
      side_agency: agency?.id ?? null,
    }))
  }

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div>
          <Label>{tableColumns.country}</Label>
          <Field
            widget="autocomplete"
            options={commonSlice.countries.data}
            value={projIdentifiers?.country}
            onChange={(_: any, value: any) => handleChangeCountry(value)}
            getOptionLabel={(option: any) =>
              getOptionLabel(commonSlice.countries.data, option)
            }
            disabled={!areNextSectionsDisabled}
            {...defaultProps}
            FieldProps={{
              className: defaultProps.FieldProps.className + ' w-[16rem]',
            }}
          />
        </div>
        <div className="w-32">
          <Label>{tableColumns.meeting}</Label>
          <PopoverInput
            label={getMeetingNr(projIdentifiers?.meeting)}
            options={getMeetingOptions()}
            onChange={handleChangeMeeting}
            onClear={() => handleChangeMeeting('')}
            className="!m-0 h-10 !py-1"
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
            onChange={(_: any, value: any) => handleChangeCurrentAgency(value)}
            getOptionLabel={(option: any) =>
              getOptionLabel(agencyOptions, option)
            }
            disabled={!areNextSectionsDisabled}
            {...defaultProps}
            FieldProps={{
              className: defaultProps.FieldProps.className + ' w-[16rem]',
            }}
          />
        </div>
        <div>
          <Label>{tableColumns.cluster}</Label>
          <Field
            widget="autocomplete"
            options={projectSlice.clusters.data}
            value={projIdentifiers?.cluster}
            onChange={(_: any, value: any) => handleChangeCluster(value)}
            getOptionLabel={(option: any) =>
              getOptionLabel(projectSlice.clusters.data, option)
            }
            disabled={!areNextSectionsDisabled}
            {...defaultProps}
            FieldProps={{
              className: defaultProps.FieldProps.className + ' w-[20rem]',
            }}
          />
        </div>
      </div>
      <FormControlLabel
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
            onChange={(_: any, value: any) => handleChangeSideAgency(value)}
            getOptionLabel={(option: any) =>
              getOptionLabel(leadAgencyOptions, option)
            }
            disabled={!areNextSectionsDisabled}
            {...defaultProps}
            FieldProps={{
              className: defaultProps.FieldProps.className + ' w-[16rem]',
            }}
          />
        </>
      )}
      <div className="flex flex-wrap items-center gap-2.5">
        <NavigationButton
          isBtnDisabled={!isNextBtnEnabled}
          direction={'next'}
          setCurrentStep={setCurrentStep}
          setCurrentTab={setCurrentTab}
        />
        {!isSubmitSuccessful && !areNextSectionsDisabled && (
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
  )
}

export default ProjectIdentifiersSection
