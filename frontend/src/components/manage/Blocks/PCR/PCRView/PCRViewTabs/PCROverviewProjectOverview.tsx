import { useContext } from 'react'

import { formatFieldLabel } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  SubSectionTitle,
  detailItem,
  dateDetailItem,
  numberDetailItem,
} from './ViewHelperComponents'
import { pcrFieldsMapping, borderedContainerClassname } from '../../constants'
import { useStore } from '@ors/store'

import { find, map, uniq } from 'lodash'
import { Divider } from '@mui/material'
import cx from 'classnames'

const PCROverviewProjectOverview = ({
  numberEnterprises,
}: {
  numberEnterprises: string
}) => {
  const { pcrMetaproject, pcrDefaultData } = useContext(PCRDataContext)
  const { countries } = useContext(ProjectsDataContext)

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

  const fieldsValues = [
    detailItem(pcrFieldsMapping.country, countryValue?.name ?? ''),
    detailItem(pcrFieldsMapping.metacode, umbrella_code ?? ''),
    dateDetailItem(
      pcrFieldsMapping.project_date_approved,
      (defaultData?.project_date_approved as string) ?? '',
    ),
    dateDetailItem(
      pcrFieldsMapping.project_date_completion,
      (defaultData?.project_date_completion as string) ?? '',
    ),
    numberDetailItem(
      pcrFieldsMapping.phase_out_ods_approved,
      defaultData?.phase_out_ods_approved as string,
      'decimal',
    ),
    numberDetailItem(
      pcrFieldsMapping.phase_out_ods_actual,
      defaultData?.phase_out_ods_actual as string,
      'decimal',
    ),
    numberDetailItem(
      formatFieldLabel(pcrFieldsMapping.phase_out_co2_eq_t_approved),
      defaultData?.phase_out_co2_eq_t_approved as string,
      'decimal',
    ),
    numberDetailItem(
      formatFieldLabel(pcrFieldsMapping.phase_out_co2_eq_t_actual),
      defaultData?.phase_out_co2_eq_t_actual as string,
      'decimal',
    ),
    numberDetailItem(
      pcrFieldsMapping.total_number_of_enterprises,
      numberEnterprises,
      'number',
    ),
    numberDetailItem(
      pcrFieldsMapping.total_number_of_trainnes,
      defaultData?.total_number_of_trainnes as string,
      'number',
    ),
  ]

  return (
    <div className={cx('mb-9 flex flex-col', borderedContainerClassname)}>
      <div className="bg-[#f4f5f6] px-6 py-4">
        <SubSectionTitle>Project overview</SubSectionTitle>
      </div>
      <div className="border-0 border-t border-solid border-[#e5e7eb] bg-white p-6">
        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2 lg:grid-cols-4 [&_h4]:break-words">
          {map(fieldsValues, (item, index) => (
            <div key={index} className="flex flex-col justify-between">
              {item}
              <Divider className="my-4" />
            </div>
          ))}
        </div>
        <div className="w-full lg:w-[85%]">
          {detailItem(pcrFieldsMapping.decisions, decisionsValues ?? '')}
        </div>
      </div>
    </div>
  )
}

export default PCROverviewProjectOverview
