import { useContext, useState } from 'react'

import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import {
  formatFieldLabel,
  onTextareaFocus,
} from '@ors/components/manage/Blocks/ProjectsListing/utils'
import {
  DateInput,
  FormattedNumberInput,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import {
  defaultProps,
  defaultPropsSimpleField,
  disabledClassName,
  formatClassName,
} from '@ors/components/manage/Blocks/ProjectsListing/constants'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { pcrFieldsMapping } from '../constants'
import { PCRDefaultData } from '../interfaces'
import { useStore } from '@ors/store'

import { find, keys, map, omit, uniq } from 'lodash'
import { Tabs, Tab, Divider } from '@mui/material'
import cx from 'classnames'
import dayjs from 'dayjs'

const PCROverviewPrefilledData = () => {
  const { countries, agencies } = useContext(ProjectsDataContext)
  const { pcrMetaproject, pcrDefaultData, fundsByAgency } =
    useContext(PCRDataContext)

  const { data: defaultData } = pcrDefaultData
  const { country, decisions } = defaultData || {}

  const countryValue = find(countries, (c) => c.id === country) ?? null

  const { data: metaprojectData } = pcrMetaproject
  const { umbrella_code } = metaprojectData || {}

  const bpSlice = useStore((state) => state.businessPlans)
  const allDecisions = bpSlice.decisions.data

  const decisionsValues = map(
    uniq(decisions),
    (decision) => find(allDecisions, (d) => d.id === decision)?.title,
  ).join(', ')

  const [crtTab, setCrtTab] = useState(0)

  const agencyIds = keys(fundsByAgency.mlf_funding_approved)
  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )

  const getFieldDefaultProps = (fieldType: string) => ({
    ...defaultPropsSimpleField,
    className: cx(
      '!ml-0 h-10',
      defaultPropsSimpleField.className,
      disabledClassName,
      { '!flex-grow-0': fieldType === 'date' },
    ),
  })

  const MetaprojectDateField = ({ field }: { field: keyof PCRDefaultData }) => (
    <div>
      <Label>{pcrFieldsMapping[field]}</Label>
      <DateInput
        id={field}
        value={(defaultData?.[field] as string) ?? ''}
        disabled={true}
        formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
        {...omit(getFieldDefaultProps('date'), ['containerClassName'])}
      />
    </div>
  )

  const MetaprojectNumberField = ({
    field,
    fieldType,
  }: {
    field: keyof PCRDefaultData
    fieldType?: string
  }) => {
    const value =
      field === 'total_number_of_enterprises'
        ? fundsByAgency[field]
        : (defaultData?.[field] as string)

    return (
      <div>
        <Label>{formatFieldLabel(pcrFieldsMapping[field])}</Label>
        <FormattedNumberInput
          id={field}
          value={value ?? ''}
          withoutDefaultValue={true}
          decimalDigits={fieldType === 'number' ? 0 : 2}
          disabled={true}
          {...getFieldDefaultProps('number')}
        />
      </div>
    )
  }

  const AgencyFundField = ({
    field,
    isTotalField = false,
  }: {
    field: keyof typeof fundsByAgency
    isTotalField?: boolean
  }) => {
    const crtAgencyId = Number(agencyIds[crtTab])

    const value = isTotalField
      ? (fundsByAgency[field] as number)
      : (fundsByAgency[field] as Record<number, number>)[crtAgencyId]

    return (
      <div className="w-60">
        <Label>{pcrFieldsMapping[field]} (US $)</Label>
        <FormattedNumberInput
          id={field}
          value={value ?? ''}
          prefix="$"
          withoutDefaultValue={true}
          disabled={true}
          {...getFieldDefaultProps('number')}
        />
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <div>
            <Label>{pcrFieldsMapping.country}</Label>
            <Field
              widget="autocomplete"
              value={countryValue}
              options={countries}
              getOptionLabel={(option) => getOptionLabel(countries, option)}
              disabled={true}
              {...defaultProps}
              {...formatClassName('min-w-56 md:min-w-[370px]')}
            />
          </div>
          <div>
            <Label>{pcrFieldsMapping.metacode}</Label>
            <SimpleInput
              id="metacode"
              value={umbrella_code}
              disabled={true}
              type="text"
              onFocus={onTextareaFocus}
              {...{
                ...defaultPropsSimpleField,
                className: cx(
                  defaultPropsSimpleField.className,
                  disabledClassName,
                ),
              }}
              containerClassName={
                defaultPropsSimpleField.containerClassName + ' !min-w-56'
              }
            />
          </div>
          <div>
            <Label>{pcrFieldsMapping.decisions}</Label>
            <SimpleInput
              id="decisions"
              value={decisionsValues}
              disabled={true}
              type="text"
              onFocus={onTextareaFocus}
              {...{
                ...defaultPropsSimpleField,
                className: cx(
                  defaultPropsSimpleField.className,
                  disabledClassName,
                ),
              }}
              containerClassName={
                defaultPropsSimpleField.containerClassName +
                ' !min-w-56 md:!min-w-[370px]'
              }
            />
          </div>
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <div className="w-[280px]">
            <MetaprojectDateField field="project_date_approved" />
          </div>
          <MetaprojectDateField field="project_date_completion" />
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <div className="w-[280px]">
            <MetaprojectNumberField field="phase_out_ods_actual" />
          </div>
          <MetaprojectNumberField field="phase_out_ods_approved" />
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <MetaprojectNumberField field="phase_out_co2_eq_t_actual" />
          <MetaprojectNumberField field="phase_out_co2_eq_t_approved" />
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <div className="w-[280px]">
            <MetaprojectNumberField
              field="total_number_of_enterprises"
              fieldType="number"
            />
          </div>
          <MetaprojectNumberField
            field="total_number_of_trainnes"
            fieldType="number"
          />
        </div>
      </div>
      <Divider className="my-6" />
      <Tabs
        aria-label="overview-tabs"
        className="sectionsTabs"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        TabIndicatorProps={{
          className: 'h-0',
          style: { transitionDuration: '150ms' },
        }}
        value={crtTab}
        onChange={(_, newValue) => {
          setCrtTab(newValue)
        }}
      >
        {crtAgencies.map((agency) => (
          <Tab key={agency} aria-controls={agency} id={agency} label={agency} />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <AgencyFundField field="mlf_funding_approved" />
          <AgencyFundField field="mlf_funding_disbursed" />
          <AgencyFundField field="mlf_funding_returned" />
        </div>
      </div>
      <div className="mt-4 flex flex-row flex-wrap gap-x-7 gap-y-4 pl-6">
        <AgencyFundField
          field="total_mlf_funding_approved"
          isTotalField={true}
        />
        <AgencyFundField
          field="total_mlf_funding_disbursed"
          isTotalField={true}
        />
        <AgencyFundField
          field="total_mlf_funding_returned"
          isTotalField={true}
        />
      </div>
    </>
  )
}

export default PCROverviewPrefilledData
