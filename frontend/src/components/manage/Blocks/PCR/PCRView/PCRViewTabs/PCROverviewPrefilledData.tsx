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
import { PCROverviewProps, PCRResponse } from '../../interfaces'
import { pcrFieldsMapping } from '../../constants'
import { useStore } from '@ors/store'

import { find, keys, map, uniq } from 'lodash'
import { Divider } from '@mui/material'
import cx from 'classnames'

const PCROverviewPrefilledData = ({ pcr }: { pcr: PCRResponse }) => {
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

  const agencyIds = keys(fundsByAgency.mlf_funding_approved)
  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )
  const agencyEntries = [...crtAgencies, 'total']

  const fundingFields = [
    'mlf_funding_approved',
    'mlf_funding_disbursed',
    'mlf_funding_returned',
  ]

  const formatAgencyFundFields = (
    field: keyof PCROverviewProps,
    agencyId?: number,
  ) => {
    const value = !!agencyId
      ? (fundsByAgency[field] as Record<number, number>)[agencyId]
      : (fundsByAgency[field] as number)

    return (value ? String(value) : null) as string
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-4">
        <div className="mb-4 grid grid-cols-3 gap-x-8">
          <div>
            {detailItem(pcrFieldsMapping.country, countryValue?.name ?? '')}
            <Divider className="my-4" />
          </div>
          <div>
            {detailItem(pcrFieldsMapping.metacode, umbrella_code ?? '')}
            <Divider className="my-4" />
          </div>
          <div>
            {detailItem(pcrFieldsMapping.decisions, decisionsValues ?? '')}
            <Divider className="my-4" />
          </div>
          <div>
            {dateDetailItem(
              pcrFieldsMapping.project_date_approved,
              (defaultData?.project_date_approved as string) ?? '',
            )}
            <Divider className="my-4" />
          </div>
          <div>
            {dateDetailItem(
              pcrFieldsMapping.project_date_completion,
              (defaultData?.project_date_completion as string) ?? '',
            )}
            <Divider className="my-4" />
          </div>
          <div />
          <div>
            {numberDetailItem(
              pcrFieldsMapping.phase_out_ods_actual,
              defaultData?.phase_out_ods_actual as string,
              'decimal',
            )}
            <Divider className="my-4" />
          </div>
          <div>
            {numberDetailItem(
              pcrFieldsMapping.phase_out_ods_approved,
              defaultData?.phase_out_ods_approved as string,
              'decimal',
            )}
            <Divider className="my-4" />
          </div>
          <div />
          <div>
            {numberDetailItem(
              formatFieldLabel(pcrFieldsMapping.phase_out_co2_eq_t_actual),
              defaultData?.phase_out_co2_eq_t_actual as string,
              'decimal',
            )}
            <Divider className="my-4" />
          </div>
          <div>
            {numberDetailItem(
              formatFieldLabel(pcrFieldsMapping.phase_out_co2_eq_t_approved),
              defaultData?.phase_out_co2_eq_t_approved as string,
              'decimal',
            )}
            <Divider className="my-4" />
          </div>
          <div />
          {numberDetailItem(
            pcrFieldsMapping.total_number_of_enterprises,
            pcr.total_number_of_enterprises,
            'number',
          )}
          {numberDetailItem(
            pcrFieldsMapping.total_number_of_trainnes,
            defaultData?.total_number_of_trainnes as string,
            'number',
          )}
        </div>
      </div>
      <Divider className="my-6" />
      <SubSectionTitle>Funding</SubSectionTitle>
      {agencyEntries.map((agency, index) => {
        const isTotal = agency === 'total'

        return (
          <div
            className={cx(
              'rounded-lg border-0 border-b-[3px] border-solid border-[#e5e7eb] bg-white p-4',
              {
                'shadow-[-3px_0_4px_-1px_#00000022,3px_0_4px_-1px_#00000022]':
                  index === 0,
                'shadow-[-3px_0_12px_-1px_#00000022,3px_0_12px_-1px_#00000022]':
                  index !== 0 && !isTotal,
                '!bg-[#F5FF8033] shadow-[-3px_0_7px_-1px_#00000015,3px_0_7px_-1px_#00000015,0_8px_24px_-2px_#00000044]':
                  isTotal,
              },
            )}
          >
            <div className="grid grid-cols-4 gap-x-8 gap-y-4">
              <div className="self-center text-3xl font-medium uppercase text-primary">
                {agency}
              </div>
              {map(fundingFields, (field) => {
                const formattedField = isTotal ? `total_${field}` : field

                return numberDetailItem(
                  pcrFieldsMapping[formattedField],
                  formatAgencyFundFields(
                    formattedField as keyof PCROverviewProps,
                    !isTotal ? Number(agencyIds[index]) : undefined,
                  ),
                  'decimal',
                  '!text-3xl',
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}

export default PCROverviewPrefilledData
