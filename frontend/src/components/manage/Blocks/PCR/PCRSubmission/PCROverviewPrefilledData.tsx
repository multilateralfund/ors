import { useContext, useState } from 'react'

import { FormattedNumberInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import {
  defaultPropsSimpleField,
  disabledClassName,
} from '@ors/components/manage/Blocks/ProjectsListing/constants'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { PCROverviewProps } from '../interfaces'
import { pcrFieldsMapping } from '../constants'

import { Tabs, Tab } from '@mui/material'
import { find, keys, map } from 'lodash'
import cx from 'classnames'

const PCROverviewPrefilledData = ({ fundsByAgency }: PCROverviewProps) => {
  const { agencies } = useContext(ProjectsDataContext)

  const [crtTab, setCrtTab] = useState(0)

  const agencyIds = keys(fundsByAgency.mlf_funding_approved)
  const crtAgencies = map(
    agencyIds,
    (id) => find(agencies, (agency) => agency.id === Number(id))?.name,
  )

  const fieldDefaultProps = {
    ...defaultPropsSimpleField,
    className: cx(
      '!ml-0 h-10',
      defaultPropsSimpleField.className,
      disabledClassName,
    ),
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
          {...fieldDefaultProps}
        />
      </div>
    )
  }

  return (
    <>
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
      <div className="flex flex-row flex-wrap gap-x-7 gap-y-4 pl-6">
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
