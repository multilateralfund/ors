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
import { PCRSelectWidget, PCRTextAreaWidget } from './PCRWidgets'
import {
  SubSectionTitle,
  getCollapseIcon,
} from '../PCRView/PCRViewTabs/ViewHelperComponents'
import { PCRDefaultData, PCROverviewProps } from '../interfaces'
import { financialFiguresTypeOptions } from '../constants'
import { getFundingClassname } from '../utils'
import {
  pcrFieldsMapping,
  viewPcrFieldsMapping,
  fundingFields,
} from '../constants'
import { useStore } from '@ors/store'

import { find, keys, map, omit, uniq } from 'lodash'
import { Divider } from '@mui/material'
import cx from 'classnames'
import dayjs from 'dayjs'

const PCROverviewPrefilledData = () => {
  const sectionIdentifier = 'overview'

  const { countries, agencies } = useContext(ProjectsDataContext)
  const {
    PCRData,
    setPCRData,
    errors,
    pcrMetaproject,
    pcrDefaultData,
    fundsByAgency,
  } = useContext(PCRDataContext)

  const { data: defaultData } = pcrDefaultData
  const { country, decisions } = defaultData || {}

  const countryValue = find(countries, (c) => c.id === country) ?? null

  const { data: metaprojectData } = pcrMetaproject
  const { umbrella_code } = metaprojectData || {}

  const { overview: overviewErrors } = errors

  const [isFundingExpanded, setIsFundingExpanded] = useState(false)

  const bpSlice = useStore((state) => state.businessPlans)
  const allDecisions = bpSlice.decisions.data

  const decisionsValues = map(
    uniq(decisions),
    (decision) => find(allDecisions, (d) => d.id === decision)?.title,
  ).join(', ')

  const agencyIds = keys(fundsByAgency.mlf_funding_approved)
  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )
  const agencyEntries = [...crtAgencies, 'total']

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
          {...omit(getFieldDefaultProps('number'), ['containerClassName'])}
        />
      </div>
    )
  }

  const AgencyFundField = ({
    field,
    agencyIndex,
    isTotalField = false,
  }: {
    field: keyof typeof fundsByAgency
    agencyIndex: number
    isTotalField?: boolean
  }) => {
    const crtAgencyId = Number(agencyIds[agencyIndex])

    const value = isTotalField
      ? (fundsByAgency[field] as number)
      : (fundsByAgency[field] as Record<number, number>)[crtAgencyId]

    return (
      <div className="w-full sm:w-60">
        <Label>
          {{ ...pcrFieldsMapping, ...viewPcrFieldsMapping }[field]} (US $)
        </Label>
        <FormattedNumberInput
          id={field}
          value={value ?? ''}
          prefix="$"
          withoutDefaultValue={true}
          disabled={true}
          {...omit(getFieldDefaultProps('number'), ['containerClassName'])}
        />
      </div>
    )
  }

  const collapseFunding = () => {
    setIsFundingExpanded(!isFundingExpanded)
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
              {...formatClassName(
                '!w-40 sm:!w-[12rem] min-w-full sm:min-w-56 md:min-w-[370px]',
              )}
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
                defaultPropsSimpleField.containerClassName +
                ' !min-w-full sm:!min-w-56'
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
                ' !min-w-full sm:!min-w-56 md:!min-w-[370px]'
              }
            />
          </div>
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <div className="w-full sm:w-[280px]">
            <MetaprojectDateField field="project_date_approved" />
          </div>
          <MetaprojectDateField field="project_date_completion" />
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <div className="w-full sm:w-[280px]">
            <MetaprojectNumberField field="phase_out_ods_actual" />
          </div>
          <MetaprojectNumberField field="phase_out_ods_approved" />
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <MetaprojectNumberField field="phase_out_co2_eq_t_actual" />
          <MetaprojectNumberField field="phase_out_co2_eq_t_approved" />
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          <div className="w-full sm:w-[280px]">
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
      <div className="mb-6 flex gap-4">
        <SubSectionTitle className="!mb-0 content-center">
          Funding
        </SubSectionTitle>
        {getCollapseIcon(isFundingExpanded, collapseFunding)}
      </div>
      {agencyEntries.map((agency, index) => {
        const isTotal = agency === 'total'

        return (
          (isFundingExpanded || isTotal) && (
            <div key={index} className={getFundingClassname(index, isTotal)}>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="self-center text-3xl font-medium uppercase text-primary">
                  {agency}
                </div>
                {map(fundingFields, (field, fieldIndex) => {
                  const formattedField = isTotal ? `total_${field}` : field

                  return (
                    <AgencyFundField
                      key={fieldIndex}
                      field={formattedField as keyof PCROverviewProps}
                      agencyIndex={index}
                      isTotalField={isTotal}
                    />
                  )
                })}
              </div>
            </div>
          )
        )
      })}
      <div className="mt-6 flex flex-row flex-wrap gap-x-7 gap-y-4">
        <PCRSelectWidget
          {...{ PCRData, setPCRData, sectionIdentifier }}
          field="financial_figures_status"
          options={financialFiguresTypeOptions}
          errors={overviewErrors}
        />
        <PCRTextAreaWidget
          {...{ PCRData, setPCRData, sectionIdentifier }}
          field="financial_figures_status_explanation"
          errors={overviewErrors}
        />
      </div>
    </>
  )
}

export default PCROverviewPrefilledData
