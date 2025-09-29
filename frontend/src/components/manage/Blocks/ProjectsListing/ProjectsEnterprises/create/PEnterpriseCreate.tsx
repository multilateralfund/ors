'use client'

import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator.tsx'
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
import { Divider } from '@mui/material'

const PEnterpriseCreate = ({
  countryId,
  errors,
  ...rest
}: PEnterpriseDataProps & { countryId: number }) => {
  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data
  const filters = {
    status: ['Pending Approval', 'Approved'],
    agencies: agency_id ? [agency_id] : null,
  }
  const { results } = useGetEnterprises(filters, countryId)

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
          key={JSON.stringify(results)}
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
    <div className="flex flex-col gap-2">
      <PEnterpriseSearch
        key={JSON.stringify(results)}
        enterprises={results}
        {...rest}
        errors={searchErrors}
      />
      <Divider className="py-2" />
      <PEnterpriseOverviewSection
        {...{ countryId, ...rest }}
        errors={overviewErrors}
      />
      <Divider className="py-2" />
      <PEnterpriseSubstanceDetailsSection
        {...{ errors, ...rest }}
        odsOdpErrors={normalizedOdsOdpErrors}
      />
      <Divider className="py-2" />
      <PEnterpriseFundingDetailsSection
        {...rest}
        errors={fundingDetailsErrors}
      />
    </div>
  )
}

export default PEnterpriseCreate
