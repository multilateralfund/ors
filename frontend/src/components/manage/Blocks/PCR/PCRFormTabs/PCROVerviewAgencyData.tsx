import { useContext, useState } from 'react'

import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { PCROverviewProps } from '../interfaces'

import { Tab, Tabs } from '@mui/material'
import { find, map } from 'lodash'
import cx from 'classnames'
import {
  defaultPropsSimpleField,
  disabledClassName,
} from '../../ProjectsListing/constants'
import { Label } from '../../BusinessPlans/BPUpload/helpers'
import { pcrFieldsMapping } from '../constants'
import { FieldErrorIndicator } from '../../ProjectsListing/HelperComponents'
import { FormattedNumberInput } from '../../Replenishment/Inputs'

const PCROVerviewAgencyData = ({ PCRData, errors }: PCROverviewProps) => {
  const sectionIdentifier = 'overview'
  const agencyOverviewIdentifier = 'agency_overview'
  const agencyOverviewData =
    PCRData[sectionIdentifier][agencyOverviewIdentifier] || []

  const { agencies } = useContext(ProjectsDataContext)

  const [crtAgency, setCrtAgency] = useState(0)

  const crtAgencies = map(
    agencyOverviewData,
    (entry) => find(agencies, (agency) => agency.id === entry.agency)?.name,
  )

  const getFieldDefaultProps = () => ({
    ...defaultPropsSimpleField,
    className: cx(
      '!ml-0 h-10',
      defaultPropsSimpleField.className,
      disabledClassName,
    ),
  })

  return (
    <div>
      <Tabs
        aria-label="agency-overview-tabs"
        className="sectionsTabs"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        TabIndicatorProps={{
          className: 'h-0',
          style: { transitionDuration: '150ms' },
        }}
        value={crtAgency}
        onChange={(_, newValue) => {
          setCrtAgency(newValue)
        }}
      >
        {crtAgencies.map((agency) => (
          <Tab key={agency} aria-controls={agency} id={agency} label={agency} />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {crtAgencies
          .filter((_, index) => index === crtAgency)
          .map(() => {
            const agencyOverviewDataEntry = agencyOverviewData[crtAgency] || []

            return (
              <div className="flex flex-col gap-y-2">
                <div className="flex flex-col gap-y-2">
                  <div className="flex flex-wrap gap-x-20 gap-y-3">
                    <div>
                      <Label>
                        {pcrFieldsMapping.mlf_funding_approved} (US $)
                      </Label>
                      <div className="flex items-center">
                        <FormattedNumberInput
                          id="mlf_funding_approved"
                          value={
                            agencyOverviewDataEntry.mlf_funding_approved ?? ''
                          }
                          prefix="$"
                          withoutDefaultValue={true}
                          disabled={true}
                          {...getFieldDefaultProps()}
                        />
                        <FieldErrorIndicator
                          errors={errors}
                          field="mlf_funding_approved"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>
                        {pcrFieldsMapping.mlf_funding_disbursed} (US $)
                      </Label>
                      <div className="flex items-center">
                        <FormattedNumberInput
                          id="mlf_funding_disbursed"
                          value={
                            agencyOverviewDataEntry.mlf_funding_disbursed ?? ''
                          }
                          prefix="$"
                          withoutDefaultValue={true}
                          disabled={true}
                          {...getFieldDefaultProps()}
                        />
                        <FieldErrorIndicator
                          errors={errors}
                          field="mlf_funding_disbursed"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>
                        {pcrFieldsMapping.mlf_funding_returned} (US $)
                      </Label>
                      <div className="flex items-center">
                        <FormattedNumberInput
                          id="mlf_funding_returned"
                          value={
                            agencyOverviewDataEntry.mlf_funding_returned ?? ''
                          }
                          prefix="$"
                          withoutDefaultValue={true}
                          disabled={true}
                          {...getFieldDefaultProps()}
                        />
                        <FieldErrorIndicator
                          errors={errors}
                          field="mlf_funding_returned"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-y-2">
                      <div className="flex flex-wrap gap-x-20 gap-y-3">
                        <div>
                          <Label>
                            {pcrFieldsMapping.total_mlf_funding_approved} (US $)
                          </Label>
                          <div className="flex items-center">
                            <FormattedNumberInput
                              id="total_mlf_funding_approved"
                              value={
                                agencyOverviewDataEntry.total_mlf_funding_approved ??
                                ''
                              }
                              prefix="$"
                              withoutDefaultValue={true}
                              disabled={true}
                              {...getFieldDefaultProps()}
                            />
                            <FieldErrorIndicator
                              errors={errors}
                              field="total_mlf_funding_approved"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>
                            {pcrFieldsMapping.total_mlf_funding_disbursed} (US
                            $)
                          </Label>
                          <div className="flex items-center">
                            <FormattedNumberInput
                              id="total_mlf_funding_disbursed"
                              value={
                                agencyOverviewDataEntry.total_mlf_funding_disbursed ??
                                ''
                              }
                              prefix="$"
                              withoutDefaultValue={true}
                              disabled={true}
                              {...getFieldDefaultProps()}
                            />
                            <FieldErrorIndicator
                              errors={errors}
                              field="total_mlf_funding_disbursed"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>
                            {pcrFieldsMapping.total_mlf_funding_returned} (US $)
                          </Label>
                          <div className="flex items-center">
                            <FormattedNumberInput
                              id="total_mlf_funding_returned"
                              value={
                                agencyOverviewDataEntry.total_mlf_funding_returned ??
                                ''
                              }
                              prefix="$"
                              withoutDefaultValue={true}
                              disabled={true}
                              {...getFieldDefaultProps()}
                            />
                            <FieldErrorIndicator
                              errors={errors}
                              field="total_mlf_funding_returned"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default PCROVerviewAgencyData
