import { useContext, useState } from 'react'

import { formatFieldLabel } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import {
  dateDetailItem,
  detailItem,
  numberDetailItem,
} from './ViewHelperComponents'
import { PCROverviewProps, PCRResponse } from '../../interfaces'
import { pcrFieldsMapping } from '../../constants'
import { useStore } from '@ors/store'

import { Tabs, Tab, Divider } from '@mui/material'
import { find, keys, map, uniq } from 'lodash'

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

  const [crtTab, setCrtTab] = useState(0)

  const agencyIds = keys(fundsByAgency.mlf_funding_approved)
  const crtAgencyId = Number(agencyIds[crtTab])
  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )

  const formatAgencyFundFields = (
    field: keyof PCROverviewProps,
    isTotalField = false,
  ) => {
    const value = isTotalField
      ? (fundsByAgency[field] as number)
      : (fundsByAgency[field] as Record<number, number>)[crtAgencyId]

    return (value ? String(value) : null) as string
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          {detailItem(pcrFieldsMapping.country, countryValue?.name ?? '')}
          {detailItem(pcrFieldsMapping.metacode, umbrella_code ?? '')}
          {detailItem(pcrFieldsMapping.decisions, decisionsValues ?? '')}
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          {dateDetailItem(
            pcrFieldsMapping.project_date_approved,
            (defaultData?.project_date_approved as string) ?? '',
          )}
          {dateDetailItem(
            pcrFieldsMapping.project_date_completion,
            (defaultData?.project_date_completion as string) ?? '',
          )}
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          {numberDetailItem(
            pcrFieldsMapping.phase_out_ods_actual,
            defaultData?.phase_out_ods_actual as string,
            'decimal',
          )}
          {numberDetailItem(
            pcrFieldsMapping.phase_out_ods_approved,
            defaultData?.phase_out_ods_approved as string,
            'decimal',
          )}
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
          {numberDetailItem(
            formatFieldLabel(pcrFieldsMapping.phase_out_co2_eq_t_actual),
            defaultData?.phase_out_co2_eq_t_actual as string,
            'decimal',
          )}
          {numberDetailItem(
            formatFieldLabel(pcrFieldsMapping.phase_out_co2_eq_t_approved),
            defaultData?.phase_out_co2_eq_t_approved as string,
            'decimal',
          )}
        </div>
        <div className="flex flex-row flex-wrap gap-x-7 gap-y-4">
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
      <Tabs
        aria-label="overview-view-tabs"
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
          {numberDetailItem(
            pcrFieldsMapping.mlf_funding_approved,
            formatAgencyFundFields('mlf_funding_approved'),
            'decimal',
          )}
          {numberDetailItem(
            pcrFieldsMapping.mlf_funding_disbursed,
            formatAgencyFundFields('mlf_funding_disbursed'),
            'decimal',
          )}
          {numberDetailItem(
            pcrFieldsMapping.mlf_funding_returned,
            formatAgencyFundFields('mlf_funding_returned'),
            'decimal',
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-row flex-wrap gap-x-7 gap-y-4 pl-6">
        {numberDetailItem(
          pcrFieldsMapping.total_mlf_funding_approved,
          formatAgencyFundFields('total_mlf_funding_approved', true),
          'decimal',
        )}
        {numberDetailItem(
          pcrFieldsMapping.total_mlf_funding_disbursed,
          formatAgencyFundFields('total_mlf_funding_disbursed', true),
          'decimal',
        )}
        {numberDetailItem(
          pcrFieldsMapping.total_mlf_funding_returned,
          formatAgencyFundFields('total_mlf_funding_returned', true),
          'decimal',
        )}
      </div>
    </>
  )
}

export default PCROverviewPrefilledData
