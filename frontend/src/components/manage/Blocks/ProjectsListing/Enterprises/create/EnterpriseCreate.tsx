import { useEffect, useMemo, useState } from 'react'

import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator.tsx'
import CustomAlert from '@ors/components/theme/Alerts/CustomAlert.tsx'
import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext.tsx'
import ProjectsInlineMessage from '../../ProjectsCreate/ProjectsInlineMessage.tsx'
import EnterpriseOverviewSection from '../formTabs/EnterpriseOverviewSection.tsx'
import EnterpriseDetailsSection from '../formTabs/EnterpriseDetailsSection.tsx'
import EnterpriseSubstanceDetailsSection from '../formTabs/EnterpriseSubstanceDetailsSection.tsx'
import EnterpriseFundingDetailsSection from '../formTabs/EnterpriseFundingDetailsSection.tsx'
import EnterpriseRemarksSection from '../formTabs/EnterpriseRemarksSection.tsx'
import EnterpriseDelete from '../delete/EnterpriseDelete.tsx'
import { formatErrors, hasSectionErrors } from '../../utils.ts'
import { enterpriseFieldsMapping } from '../constants.ts'
import {
  getCostEffectivenessApproved,
  getFundsApproved,
  getFieldErrors,
} from '../utils.ts'
import {
  EnterpriseData,
  EnterpriseFormProps,
  EnterpriseSubstanceDetails,
} from '../interfaces.ts'
import useVisibilityChange from '@ors/hooks/useVisibilityChange.ts'
import { useStore } from '@ors/store.tsx'

import { find, has, map, omit, uniq, values } from 'lodash'
import { Tabs, Tab, Typography } from '@mui/material'

const EnterpriseCreate = ({
  mode,
  errors,
  ...rest
}: EnterpriseFormProps & { mode: string }) => {
  const { updatedFields, addUpdatedField, clearUpdatedFields } =
    useUpdatedFields()

  const [currentTab, setCurrentTab] = useState(0)

  const { enterprise, enterpriseData, setEnterpriseData } = rest
  const {
    overview,
    details,
    substance_fields,
    substance_details,
    funding_details,
    remarks,
  } = enterpriseData ?? {}
  const { capital_cost_approved, operating_cost_approved } =
    funding_details ?? {}

  const fundsApproved = useMemo(
    () =>
      getFundsApproved(
        capital_cost_approved,
        operating_cost_approved,
      )?.toString() ?? null,
    [capital_cost_approved, operating_cost_approved],
  )

  const costEffectivenessApproved = useMemo(
    () =>
      getCostEffectivenessApproved(
        substance_details,
        fundsApproved,
      )?.toString() ?? null,
    [substance_details, fundsApproved],
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
  }, [fundsApproved, costEffectivenessApproved])

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

  useVisibilityChange(updatedFields.size > 0)

  useEffect(() => {
    clearUpdatedFields()
  }, [])

  const { inlineMessage, setInlineMessage } = useStore(
    (state) => state.inlineMessage,
  )

  useEffect(() => {
    setInlineMessage(null)
  }, [])

  const setEnterpriseDataWithEditTracking = (
    updater: React.SetStateAction<EnterpriseData>,
    fieldName?: string,
  ) => {
    setEnterpriseData((prevData) => {
      if (fieldName) {
        addUpdatedField(fieldName)
      }

      return typeof updater === 'function'
        ? (updater as (prev: EnterpriseData) => EnterpriseData)(prevData)
        : updater
    })
  }

  const overviewErrors = getFieldErrors(overview, errors)
  const detailsErrors = getFieldErrors(details, errors)
  const substanceErrors = getFieldErrors(substance_fields, errors)
  const fundingDetailsErrors = getFieldErrors(funding_details, errors)
  const remarksErrors = getFieldErrors(remarks, errors)

  const substancesNonFieldErrors = {
    Subtances:
      (errors?.['ods_odp'] as { non_field_errors?: string[] })
        ?.non_field_errors || [],
  }

  const substancesErrors = map(errors?.ods_odp, (error: {}, index) => ({
    ...error,
    id: index,
  })).filter((error) => !has(error, 'non_field_errors'))
  const normalizedSubstancesErrors = map(substancesErrors, (error) =>
    omit(error, 'id'),
  )
  const formattedSubstancesErrors = map(
    substancesErrors as Array<EnterpriseSubstanceDetails & { id: number }>,
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

  const tabs = [
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
        <EnterpriseOverviewSection
          {...{ mode, ...rest }}
          setEnterpriseData={setEnterpriseDataWithEditTracking}
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
        <EnterpriseDetailsSection
          {...rest}
          setEnterpriseData={setEnterpriseDataWithEditTracking}
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
            values(substancesNonFieldErrors)[0].length > 0 ||
            formattedSubstancesErrors.length > 0) && (
            <SectionErrorIndicator errors={[]} />
          )}
        </div>
      ),
      component: (
        <EnterpriseSubstanceDetailsSection
          {...rest}
          setEnterpriseData={setEnterpriseDataWithEditTracking}
          errors={substanceErrors}
          substancesErrors={normalizedSubstancesErrors}
        />
      ),
      errors: [
        ...formatErrors(substanceErrors, enterpriseFieldsMapping),
        ...formatErrors(substancesNonFieldErrors, enterpriseFieldsMapping),
        ...formattedSubstancesErrors,
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
        <EnterpriseFundingDetailsSection
          {...rest}
          setEnterpriseData={setEnterpriseDataWithEditTracking}
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
      component: (
        <EnterpriseRemarksSection
          {...rest}
          setEnterpriseData={setEnterpriseDataWithEditTracking}
          errors={remarksErrors}
        />
      ),
      errors: formatErrors(remarksErrors, enterpriseFieldsMapping),
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <Tabs
          aria-label="enterprise-form"
          className="sectionsTabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          TabIndicatorProps={{
            className: 'h-0',
            style: { transitionDuration: '150ms' },
          }}
          value={currentTab}
          onChange={(_, newValue) => {
            setCurrentTab(newValue)
          }}
        >
          {tabs.map(({ id, label }) => (
            <Tab key={id} aria-controls={id} {...{ id, label }} />
          ))}
        </Tabs>
        {!!enterprise && <EnterpriseDelete {...{ enterprise }} />}
      </div>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {tabs
          .filter((_, index) => index === currentTab)
          .map(({ id, component, errors }) => (
            <span key={id}>
              {!!inlineMessage && <ProjectsInlineMessage />}
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
            </span>
          ))}
      </div>
    </>
  )
}

export default EnterpriseCreate
