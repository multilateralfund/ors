import PopoverInput from '@ors/components/manage/Blocks/Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
// import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
// import {
//   ProjectData,
//   ProjIdentifiers,
// } from '@ors/components/manage/Blocks/ProjectsListing/interfaces.ts'
import { getMeetingNr } from '@ors/components/manage/Utils/utilFunctions'
// import { changeHandler } from './SpecificFieldsHelpers'
// import { defaultProps, disabledClassName, tableColumns } from '../constants'
import { PCROverviewProps } from '../interfaces'
import { pcrFieldsMapping } from '../constants'
import { FieldErrorIndicator } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import {
  defaultProps,
  defaultPropsSimpleField,
  disabledClassName,
} from '@ors/components/manage/Blocks/ProjectsListing/constants'
// import { ApiAgency } from '@ors/types/api_agencies'
// import { Cluster, Country } from '@ors/types/store'
// import { parseNumber } from '@ors/helpers'
import { DateInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import dayjs from 'dayjs'

import cx from 'classnames'

const PCROverviewPrefilledData = ({
  PCRData,
  setPCRData,
  errors,
}: PCROverviewProps) => {
  const sectionIdentifier = 'overview'
  const overviewData = PCRData[sectionIdentifier]

  const getSectionDefaultProps = () => ({
    ...defaultProps,
    FieldProps: { className: cx(defaultProps.FieldProps.className, 'w-full') },
  })

  const getFieldDefaultProps = () => ({
    ...defaultPropsSimpleField,
    className: cx(
      '!ml-0 h-10',
      defaultPropsSimpleField.className,
      disabledClassName,
    ),
  })

  const defaultPropsDateInput = {
    className: 'BPListUpload !ml-0 h-10 w-40 !flex-grow-0',
  }

  // const handleChangeCountry = (country: Country) => {
  //   changeHandler['drop_down']<ProjectData, ProjIdentifiers>(
  //     country,
  //     'country',
  //     setPCRData,
  //     sectionIdentifier,
  //   )
  // }

  // const handleChangeAgency = (value: ApiAgency | null) => {
  //   changeHandler['drop_down']<ProjectData, ProjIdentifiers>(
  //     value,
  //     'agency',
  //     setPCRData,
  //     sectionIdentifier,
  //   )
  // }

  // const handleChangeLeadAgency = (value: ApiAgency | null) => {
  //   changeHandler['drop_down']<ProjectData, ProjIdentifiers>(
  //     value,
  //     'lead_agency',
  //     setPCRData,
  //     sectionIdentifier,
  //   )
  // }

  // const handleChangeCluster = (cluster: Cluster) => {
  //   changeHandler['drop_down']<ProjectData, ProjIdentifiers>(
  //     cluster,
  //     'cluster',
  //     setPCRData,
  //     sectionIdentifier,
  //   )
  // }

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div className="flex-shrink basis-[25rem]">
          <Label>{pcrFieldsMapping.country}</Label>
          <div className="flex items-center">
            <div className="w-full">
              <Field
                widget="autocomplete"
                options={[]}
                value={overviewData.country}
                disabled={true}
                {...getSectionDefaultProps()}
              />
            </div>
            <FieldErrorIndicator errors={errors} field="country" />
          </div>
        </div>
        <div>
          <Label>{pcrFieldsMapping.metacode}</Label>
          <div className="flex items-center">
            <SimpleInput
              id="metacode"
              value={overviewData.metacode}
              disabled={true}
              type="text"
              {...getFieldDefaultProps()}
            />
            <FieldErrorIndicator errors={errors} field="metacode" />
          </div>
        </div>
        <div>
          <Label>{pcrFieldsMapping.meeting}</Label>
          <div className="flex items-center">
            <div className="w-32">
              <PopoverInput
                label={getMeetingNr(
                  overviewData.meeting ?? undefined,
                )?.toString()}
                options={[]}
                disabled={true}
                className={cx('!m-0 h-10 !py-1', disabledClassName)}
              />
            </div>
            <FieldErrorIndicator errors={errors} field="meeting" />
          </div>
        </div>
        {/* <div className="flex-shrink basis-[18rem]">
          <Label>{tableColumns.agency}</Label>
          <div className="flex items-center">
            <div className="flex w-full">
              <Field
                widget="autocomplete"
                options={agencies}
                value={projIdentifiers?.agency}
                onChange={(_, value) => {
                  handleChangeAgency(value)

                  if (!projIdentifiers.lead_agency_submitting_on_behalf) {
                    handleChangeLeadAgency(value)
                  }
                }}
                getOptionLabel={(option) => getOptionLabel(agencies, option)}
                disabled={true}
                {...getSectionDefaultProps('agency')}
              />
            </div>
            <div className="w-8">
              <FieldErrorIndicator errors={errors} field="agency" />
            </div>
          </div>
        </div> */}
      </div>
      {/* <div className="flex w-fit grid-cols-3 flex-wrap gap-x-20 gap-y-2 md:grid"> */}
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div>
          <Label>{pcrFieldsMapping.date_of_approval}</Label>
          <div className="flex items-center">
            <DateInput
              id="date_of_approval"
              value={overviewData.date_of_approval as string}
              formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
              disabled={true}
              className={cx(defaultPropsDateInput.className, disabledClassName)}
            />
            <FieldErrorIndicator errors={errors} field="date_of_approval" />
          </div>
        </div>

        <div>
          <Label>{pcrFieldsMapping.date_of_completion}</Label>
          <div className="flex items-center">
            <DateInput
              id="date_of_completion"
              value={overviewData.date_of_completion as string}
              formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
              disabled={true}
              className={cx(defaultPropsDateInput.className, disabledClassName)}
            />
            <FieldErrorIndicator errors={errors} field="date_of_completion" />
          </div>
        </div>
      </div>
      {/* <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div className="flex-shrink basis-[25rem]">
          <Label>{tableColumns.cluster}</Label>
          <div className="flex items-center">
            <div className="w-full">
              <Field
                widget="autocomplete"
                options={clusters}
                value={projIdentifiers?.cluster}
                onChange={(_, value) => handleChangeCluster(value)}
                getOptionLabel={(option) => getOptionLabel(clusters, option)}
                disabled={true}
                {...getSectionDefaultProps('cluster')}
              />
            </div>
            <div className="w-8">
              <FieldErrorIndicator errors={errors} field="cluster" />
            </div>
          </div>
        </div>
        <div>
          <Label>{tableColumns.category}</Label>
          <Field
            widget="autocomplete"
            value={projIdentifiers?.category}
            options={[]}
            disabled={true}
            {...defaultProps}
            FieldProps={{
              className: defaultProps.FieldProps.className + ' w-[7rem]',
            }}
          />
        </div>
      </div>
      <>
        <div className="flex">
          <div className="flex-shrink basis-[25rem]">
            <Label>{tableColumns.lead_agency}</Label>
            <div className="flex items-center">
              <div className="w-full">
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
                  disabled={true}
                  {...getSectionDefaultProps('lead_agency')}
                />
              </div>
              <div className="w-8">
                <FieldErrorIndicator errors={errors} field="lead_agency" />
              </div>
            </div>
          </div>
        </div>
      </> */}
    </div>
  )
}

export default PCROverviewPrefilledData
