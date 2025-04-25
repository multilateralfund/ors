import { ChangeEvent } from 'react'

import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { NavigationButton } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/NavigationButton'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import {
  getMeetingNr,
  getMeetingOptions,
} from '@ors/components/manage/Utils/utilFunctions'
import { tableColumns } from '../constants'

import { useStore } from '@ors/store'

import { Checkbox, FormControlLabel } from '@mui/material'

const ProjectIdentifiersSection = ({
  projIdentifiers,
  setProjIdentifiers,
  ...rest
}: any) => {
  const commonSlice = useStore((state) => state.common)
  const projectSlice = useStore((state) => state.projects)

  const defaultProps = {
    FieldProps: { className: 'mb-0 w-40 BPListUpload' },
    getOptionLabel: (option: any) => option?.name,
  }

  const isNextBtnEnabled =
    projIdentifiers.country &&
    ((projIdentifiers.is_lead_agency && projIdentifiers.current_agency) ||
      (!projIdentifiers.is_lead_agency && projIdentifiers.side_agency)) &&
    projIdentifiers.meeting

  const handleChangeCountry = (country: any) => {
    setProjIdentifiers((prevFilters: any) => ({
      ...prevFilters,
      country: country?.id ?? null,
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

  const handleChangeCluster = (cluster: any) => {
    setProjIdentifiers((prevFilters: any) => ({
      ...prevFilters,
      cluster: cluster?.id ?? null,
    }))
  }

  const handleChangeMeeting = (meeting: string) => {
    setProjIdentifiers((prevFilters: any) => ({
      ...prevFilters,
      meeting,
    }))
  }

  const handleChangeDecision = (event: ChangeEvent<HTMLInputElement>) => {
    setProjIdentifiers((prevFilters: any) => ({
      ...prevFilters,
      decision: event.target.value,
    }))
  }

  return (
    <>
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div>
          <Label isRequired>{tableColumns.country}</Label>
          <Field
            widget="autocomplete"
            options={commonSlice.countries.data}
            value={projIdentifiers?.country}
            onChange={(_: any, value: any) => handleChangeCountry(value)}
            {...defaultProps}
          />
        </div>
        <div>
          <Label isRequired>{tableColumns.agency}</Label>
          <Field
            widget="autocomplete"
            options={commonSlice.agencies.data}
            value={projIdentifiers?.current_agency}
            onChange={(_: any, value: any) => handleChangeCurrentAgency(value)}
            {...defaultProps}
          />
        </div>
      </div>
      <FormControlLabel
        label="Confirm you are the lead agency submitting on behalf of a cooperating agency."
        control={
          <Checkbox
            checked={projIdentifiers?.is_lead_agency}
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
          <Label isRequired>Lead agency</Label>
          <Field
            widget="autocomplete"
            options={commonSlice.agencies.data}
            value={projIdentifiers?.side_agency}
            onChange={(_: any, value: any) => handleChangeSideAgency(value)}
            {...defaultProps}
            getOptionLabel={(option: any) =>
              getOptionLabel(commonSlice.agencies.data, option)
            }
          />
        </>
      )}
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div>
          <Label>{tableColumns.cluster}</Label>
          <Field
            widget="autocomplete"
            options={projectSlice.clusters.data}
            value={projIdentifiers?.cluster}
            onChange={(_: any, value: any) => handleChangeCluster(value)}
            {...defaultProps}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div className="w-40">
          <Label isRequired>Meeting number</Label>
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
        <div>
          <Label>Decision number</Label>
          <SimpleInput
            id={projIdentifiers?.decision}
            onChange={handleChangeDecision}
            type="number"
            label=""
            className="BPListUpload mb-0 border-primary"
            containerClassName="!h-fit w-40"
          />
        </div>
      </div>
      <NavigationButton
        isBtnDisabled={!isNextBtnEnabled}
        direction={'next'}
        {...rest}
      />
    </>
  )
}

export default ProjectIdentifiersSection
