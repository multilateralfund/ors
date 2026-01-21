import { useEffect, useMemo, useState } from 'react'

import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator.tsx'
import CustomAlert from '@ors/components/theme/Alerts/CustomAlert.tsx'
import PEnterpriseSearch from '../tabs/PEnterpriseSearch.tsx'
import PEnterpriseOverviewSection from '../tabs/PEnterpriseOverviewSection.tsx'
import PEnterpriseDetailsSection from '../tabs/PEnterpriseDetailsSection.tsx'
import PEnterpriseSubstanceDetailsSection from '../tabs/PEnterpriseSubstanceDetailsSection.tsx'
import PEnterpriseFundingDetailsSection from '../tabs/PEnterpriseFundingDetailsSection.tsx'
import PEnterpriseRemarksSection from '../tabs/PEnterpriseRemarksSection.tsx'
import { useGetEnterprises } from '../../hooks/useGetEnterprises.ts'
import { formatErrors, hasSectionErrors } from '../../utils.ts'
import { enterpriseFieldsMapping } from '../constants.ts'
import {
  getCostEffectivenessApproved,
  getFieldErrors,
  getFundsApproved,
} from '../utils.ts'
import {
  PEnterpriseDataProps,
  EnterpriseSubstanceDetails,
  OptionsType,
  ProjectTypeApi,
} from '../../interfaces.ts'
import { useStore } from '@ors/store.tsx'

import { find, has, map, omit, pick, uniq, values } from 'lodash'
import { Tabs, Tab, Typography } from '@mui/material'

const PEnterpriseCreate = ({
  projectData,
  enterpriseStatuses,
  errors,
  ...rest
}: PEnterpriseDataProps & {
  projectData: ProjectTypeApi
  enterpriseStatuses?: OptionsType[]
}) => {
  const [currentTab, setCurrentTab] = useState<number>(0)

  const filters = {
    status: ['Pending Approval', 'Approved'],
  }
  const { country_id: countryId } = projectData
  const { results } = useGetEnterprises(filters, countryId)

  const { enterpriseData, setEnterpriseData, enterprise } = rest
  const {
    overview,
    details,
    substance_details,
    substance_fields,
    funding_details,
    remarks,
  } = enterpriseData ?? {}
  const { capital_cost_approved, operating_cost_approved } =
    funding_details ?? {}

  const costEffectivenessApproved = useMemo(
    () =>
      getCostEffectivenessApproved(
        substance_details,
        capital_cost_approved,
        operating_cost_approved,
      )?.toString() ?? null,
    [substance_details, capital_cost_approved, operating_cost_approved],
  )

  const fundsApproved = useMemo(
    () =>
      getFundsApproved(
        capital_cost_approved,
        operating_cost_approved,
      )?.toString() ?? null,
    [capital_cost_approved, operating_cost_approved],
  )

  useEffect(() => {
    setEnterpriseData((prevData) => ({
      ...prevData,
      funding_details: {
        ...prevData['funding_details'],
        funds_approved: fundsApproved,
        cost_effectiveness_approved: costEffectivenessApproved,
      },
    }))
  }, [costEffectivenessApproved, fundsApproved])

  const projectSlice = useStore((state) => state.projects)
  const meetings = projectSlice.meetings.data

  useEffect(() => {
    const meetingDate =
      find(meetings, (meeting) => meeting.id === details.meeting)?.date ?? null

    setEnterpriseData((prevData) => ({
      ...prevData,
      details: {
        ...prevData['details'],
        date_of_approval: meetingDate,
      },
    }))
  }, [details.meeting])

  const enterpriseErrors =
    (errors as unknown as { [key: string]: { [key: string]: string[] } })?.[
      'enterprise'
    ] ?? {}
  const formattedEnterpriseErrors =
    !!enterprise && errors?.status
      ? { ...enterpriseErrors, status: errors.status }
      : enterpriseErrors

  const searchErrors = getFieldErrors(
    pick(overview, 'id'),
    enterpriseErrors,
    !!enterprise,
  )
  const overviewErrors = getFieldErrors(
    omit(overview, 'id'),
    formattedEnterpriseErrors,
  )
  const detailsErrors = getFieldErrors(details, errors)
  const substanceErrors = getFieldErrors(substance_fields, errors)
  const fundingDetailsErrors = getFieldErrors(funding_details, errors)
  const remarksErrors = getFieldErrors(remarks, errors)

  const odsOdpNonFieldErrors = {
    Subtances:
      (errors?.['ods_odp'] as { non_field_errors?: string[] } | undefined)
        ?.non_field_errors || [],
  }
  const odsOdpErrors = map(errors?.ods_odp, (odp: {}, index) => ({
    ...odp,
    id: index,
  })).filter((odp) => !has(odp, 'non_field_errors'))
  const normalizedOdsOdpErrors = map(odsOdpErrors, (error) => omit(error, 'id'))

  const formattedOdsOdpErrors = map(
    odsOdpErrors as Array<EnterpriseSubstanceDetails & { id?: number }>,
    ({ id, ...fields }) => {
      const fieldLabels = uniq(
        map(fields, (errorMsgs, field) => {
          if (Array.isArray(errorMsgs) && errorMsgs.length > 0) {
            return enterpriseFieldsMapping[field]
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
      errors: formatErrors(searchErrors, enterpriseFieldsMapping),
    },
    {
      id: 'enterprise-overview',
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
          {...{ countryId, enterpriseStatuses, ...rest }}
          errors={overviewErrors}
        />
      ),
      errors: formatErrors(overviewErrors, enterpriseFieldsMapping),
    },
    {
      id: 'enterprise-details',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Details</div>
          {hasSectionErrors(detailsErrors) && (
            <SectionErrorIndicator errors={[]} />
          )}
        </div>
      ),
      component: (
        <PEnterpriseDetailsSection
          {...{ projectData, ...rest }}
          errors={detailsErrors}
        />
      ),
      errors: formatErrors(detailsErrors, enterpriseFieldsMapping),
    },
    {
      id: 'enterprise-substance-details',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Substance details</div>
          {(hasSectionErrors(substanceErrors) ||
            values(odsOdpNonFieldErrors)[0].length > 0 ||
            formattedOdsOdpErrors.length > 0) && (
            <SectionErrorIndicator errors={[]} />
          )}
        </div>
      ),
      component: (
        <PEnterpriseSubstanceDetailsSection
          {...rest}
          errors={substanceErrors}
          odsOdpErrors={normalizedOdsOdpErrors}
        />
      ),
      errors: [
        ...formatErrors(substanceErrors, enterpriseFieldsMapping),
        ...formatErrors(odsOdpNonFieldErrors, enterpriseFieldsMapping),
        ...formattedOdsOdpErrors,
      ],
    },
    {
      id: 'enterprise-funding-details',
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
      errors: formatErrors(fundingDetailsErrors, enterpriseFieldsMapping),
    },
    {
      id: 'enterprise-remarks',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div className="leading-tight">Remarks</div>
          {hasSectionErrors(remarksErrors) && (
            <SectionErrorIndicator errors={[]} />
          )}
        </div>
      ),
      component: <PEnterpriseRemarksSection {...rest} errors={remarksErrors} />,
      errors: formatErrors(remarksErrors, enterpriseFieldsMapping),
    },
  ]

  return (
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
        {steps.map(({ id, label }) => (
          <Tab id={id} aria-controls={id} label={label} />
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
  )
}

export default PEnterpriseCreate
