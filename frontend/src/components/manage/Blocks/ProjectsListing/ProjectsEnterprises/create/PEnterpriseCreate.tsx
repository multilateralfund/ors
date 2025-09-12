'use client'

import { useState } from 'react'

import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator.tsx'
import CustomAlert from '@ors/components/theme/Alerts/CustomAlert.tsx'
import Loading from '@ors/components/theme/Loading/Loading.tsx'
import PEnterpriseSearch from '../tabs/PEnterpriseSearch.tsx'
import PEnterpriseOverviewSection from '../tabs/PEnterpriseOverviewSection.tsx'
import PEnterpriseSubstanceDetailsSection from '../tabs/PEnterpriseSubstanceDetailsSection.tsx'
import PEnterpriseFundingDetailsSection from '../tabs/PEnterpriseFundingDetailsSection.tsx'
import { useGetEnterprises } from '../../hooks/useGetEnterprises.ts'
import { formatErrors, hasSectionErrors } from '../../utils.ts'
import { tableColumns } from '../../constants.ts'
import { getFieldErrors } from '../utils.ts'
import {
  PEnterpriseDataProps,
  EnterpriseSubstanceDetails,
} from '../../interfaces.ts'
import { useStore } from '@ors/store.tsx'

import { has, isEmpty, map, omit, pick, uniq, values } from 'lodash'
import { Tabs, Tab, Typography } from '@mui/material'

const PEnterpriseCreate = ({
  countryId,
  errors,
  ...rest
}: PEnterpriseDataProps & { countryId: number }) => {
  const [currentTab, setCurrentTab] = useState<number>(0)

  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data
  const filters = {
    status: ['Pending Approval', 'Approved'],
    agencies: agency_id ? [agency_id] : null,
  }
  const { results, loading } = useGetEnterprises(filters, countryId)

  const { overview, funding_details } = rest.enterpriseData ?? {}
  const enterpriseErrors =
    (errors as unknown as { [key: string]: { [key: string]: string[] } })?.[
      'enterprise'
    ] ?? {}
  const searchErrors = getFieldErrors(
    pick(overview, 'id'),
    enterpriseErrors,
    true,
  )
  const overviewErrors = getFieldErrors(omit(overview, 'id'), enterpriseErrors)
  const fundingDetailsErrors = getFieldErrors(funding_details, errors)

  const odsOdpNonFieldErrors = {
    Subtances:
      (errors?.['ods_odp'] as { non_field_errors?: string[] } | undefined)
        ?.non_field_errors || [],
  }
  const odsOdpErrors = map(errors?.ods_odp, (odp: {}, index) =>
    !isEmpty(odp) ? { ...odp, id: index } : { ...odp },
  ).filter((odp) => !isEmpty(odp) && !has(odp, 'non_field_errors'))
  const normalizedOdsOdpErrors = map(odsOdpErrors, (error) => omit(error, 'id'))

  const formattedOdsOdpErrors = map(
    odsOdpErrors as Array<EnterpriseSubstanceDetails & { id?: number }>,
    ({ id, ...fields }) => {
      const fieldLabels = uniq(
        map(fields, (errorMsgs, field) => {
          if (Array.isArray(errorMsgs) && errorMsgs.length > 0) {
            return tableColumns[field]
          }
          return null
        }),
      ).filter(Boolean)

      if (fieldLabels.length === 0) return null

      return {
        message: `Substance ${Number(id) + 1} - ${fieldLabels.join(', ')}: ${fieldLabels.length > 1 ? 'These fields are not' : 'This field is not'} valid.`,
      }
    },
  ).filter(Boolean)

  const steps = [
    {
      id: 'enterprise-search',
      ariaControls: 'enterprise-search',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Search</div>
          {hasSectionErrors(searchErrors) && (
            <SectionErrorIndicator errors={[]} />
          )}
        </div>
      ),
      component: (
        <PEnterpriseSearch
          enterprises={results}
          {...rest}
          errors={searchErrors}
        />
      ),
      errors: formatErrors(searchErrors),
    },
    {
      id: 'enterprise-overview',
      ariaControls: 'enterprise-overview',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Overview</div>
          {hasSectionErrors(overviewErrors) && (
            <SectionErrorIndicator errors={[]} />
          )}
        </div>
      ),
      component: (
        <PEnterpriseOverviewSection
          {...{ countryId, ...rest }}
          errors={overviewErrors}
        />
      ),
      errors: formatErrors(overviewErrors),
    },
    {
      id: 'enterprise-substance-details',
      ariaControls: 'enterprise-substance-details',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Substance details</div>
          {(formattedOdsOdpErrors.length > 0 ||
            values(odsOdpNonFieldErrors)[0].length > 0) && (
            <SectionErrorIndicator errors={[]} />
          )}
        </div>
      ),
      component: (
        <PEnterpriseSubstanceDetailsSection
          {...{ errors, ...rest }}
          odsOdpErrors={normalizedOdsOdpErrors}
        />
      ),
      errors: [...formatErrors(odsOdpNonFieldErrors), ...formattedOdsOdpErrors],
    },
    {
      id: 'enterprise-funding-details',
      ariaControls: 'enterprise-funding-details',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Funding details</div>
          {hasSectionErrors(fundingDetailsErrors) && (
            <SectionErrorIndicator errors={[]} />
          )}
        </div>
      ),
      component: (
        <PEnterpriseFundingDetailsSection
          {...rest}
          errors={fundingDetailsErrors}
        />
      ),
      errors: formatErrors(fundingDetailsErrors),
    },
  ]

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && results && (
        <>
          <Tabs
            aria-label="create-project-enterprise"
            value={currentTab}
            className="sectionsTabs"
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            TabIndicatorProps={{
              className: 'h-0',
              style: { transitionDuration: '150ms' },
            }}
            onChange={(_, newValue) => {
              setCurrentTab(newValue)
            }}
          >
            {steps.map(({ id, ariaControls, label }) => (
              <Tab id={id} aria-controls={ariaControls} label={label} />
            ))}
          </Tabs>
          <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
            {steps
              .filter((_, index) => index === currentTab)
              .map(({ component, errors }) => (
                <>
                  {errors && errors.length > 0 && (
                    <CustomAlert
                      type="error"
                      alertClassName="mb-5"
                      content={
                        <>
                          <Typography className="text-lg">
                            Please make sure all the sections are valid.
                          </Typography>
                          <div className="mt-1 flex flex-col gap-1.5 text-base">
                            {errors.map((err, idx) =>
                              err ? (
                                <div key={idx}>
                                  {'\u2022'} {err.message}
                                </div>
                              ) : null,
                            )}
                          </div>
                        </>
                      }
                    />
                  )}
                  {component}
                </>
              ))}
          </div>
        </>
      )}
    </>
  )
}

export default PEnterpriseCreate
