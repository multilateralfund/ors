import { Fragment, useContext, useState } from 'react'

import { formatFieldLabel } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  SubSectionTitle,
  detailItem,
  dateDetailItem,
  numberDetailItem,
  getCollapseIcon,
} from './ViewHelperComponents'
import { PCROverviewProps, PCRResponse } from '../../interfaces'
import { getFundingClassname } from '../../utils'
import {
  pcrFieldsMapping,
  viewPcrFieldsMapping,
  fundingFields,
  borderedValueClassname,
  overviewTextareaClassname,
} from '../../constants'
import { useStore } from '@ors/store'

import { find, keys, map, uniq } from 'lodash'
import { Divider } from '@mui/material'

const PCROverviewPrefilledData = ({ pcr }: { pcr: PCRResponse }) => {
  const { countries, agencies } = useContext(ProjectsDataContext)
  const { pcrMetaproject, pcrDefaultData, fundsByAgency } =
    useContext(PCRDataContext)

  const [isFundingExpanded, setIsFundingExpanded] = useState(false)

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

  const formatAgencyFundFields = (
    field: keyof PCROverviewProps,
    agencyId?: number,
  ) => {
    const value = !!agencyId
      ? (fundsByAgency[field] as Record<number, number>)[agencyId]
      : (fundsByAgency[field] as number)

    return (value ? String(value) : null) as string
  }

  const collapseFunding = () => {
    setIsFundingExpanded(!isFundingExpanded)
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-4">
        <div className="mb-4 grid grid-cols-1 gap-x-8 md:grid-cols-2 lg:grid-cols-3">
          <div>
            {detailItem(pcrFieldsMapping.country, countryValue?.name ?? '')}
            <Divider className="my-4" />
          </div>
          <div>
            {detailItem(pcrFieldsMapping.metacode, umbrella_code ?? '')}
            <Divider className="my-4" />
          </div>
          <div className="md:col-span-2 lg:col-span-1">
            {detailItem(pcrFieldsMapping.decisions, decisionsValues ?? '')}
            <Divider className="my-4 md:w-[calc(50%-16px)] lg:w-full" />
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
          <div className="hidden lg:block" />
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
          <div className="hidden lg:block" />
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
          <div className="hidden lg:block" />
          <div>
            {numberDetailItem(
              pcrFieldsMapping.total_number_of_enterprises,
              pcr.total_number_of_enterprises,
              'number',
            )}
            <Divider className="my-4 block md:hidden" />
          </div>
          {numberDetailItem(
            pcrFieldsMapping.total_number_of_trainnes,
            defaultData?.total_number_of_trainnes as string,
            'number',
          )}
        </div>
      </div>
      <Divider className="my-6" />
      <div className="mb-6 flex gap-4">
        <SubSectionTitle className="!mb-0 content-center">
          Funding
        </SubSectionTitle>
        {detailItem('', pcr.financial_figures_status, {
          containerClassname: '!gap-0',
          valueClassname: borderedValueClassname,
        })}
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
                    <Fragment key={fieldIndex}>
                      {numberDetailItem(
                        { ...pcrFieldsMapping, ...viewPcrFieldsMapping }[
                          formattedField
                        ],
                        formatAgencyFundFields(
                          formattedField as keyof PCROverviewProps,
                          !isTotal ? Number(agencyIds[index]) : undefined,
                        ),
                        'decimal',
                        '!text-3xl',
                      )}
                    </Fragment>
                  )
                })}
              </div>
            </div>
          )
        )
      })}
      {isFundingExpanded && (
        <div className="mt-6">
          {detailItem(
            pcrFieldsMapping.financial_figures_status_explanation,
            pcr.financial_figures_status_explanation,
            overviewTextareaClassname,
          )}
        </div>
      )}
    </>
  )
}

export default PCROverviewPrefilledData
