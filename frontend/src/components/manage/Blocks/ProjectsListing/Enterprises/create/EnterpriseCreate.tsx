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
import EnterpriseDelete from '../view/EnterpriseDelete.tsx'
import { formatErrors, hasSectionErrors } from '../../utils.ts'
import { enterpriseFieldsMapping } from '../constants.ts'
import {
  getCostEffectivenessApproved,
  getFieldErrors,
  getFundsApproved,
} from '../utils.ts'
import {
  EnterpriseDataProps,
  EnterpriseSubstanceDetails,
  EnterpriseData,
} from '../../interfaces.ts'
import useVisibilityChange from '@ors/hooks/useVisibilityChange.ts'
import { useStore } from '@ors/store.tsx'

import { find, has, map, omit, uniq, values } from 'lodash'
import { Tabs, Tab, Typography } from '@mui/material'

const EnterpriseCreate = ({
  mode,
  errors,
  ...rest
}: EnterpriseDataProps & { mode: string }) => {
  const { updatedFields, addUpdatedField, clearUpdatedFields } =
    useUpdatedFields()

  const [currentTab, setCurrentTab] = useState<number>(0)

  const { enterprise, enterpriseData, setEnterpriseData } = rest
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

  useVisibilityChange(updatedFields.size > 0)

  const overviewErrors = getFieldErrors(overview, errors)
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
            values(odsOdpNonFieldErrors)[0].length > 0 ||
            formattedOdsOdpErrors.length > 0) && (
            <SectionErrorIndicator errors={[]} />
          )}
        </div>
      ),
      component: (
        <EnterpriseSubstanceDetailsSection
          {...rest}
          setEnterpriseData={setEnterpriseDataWithEditTracking}
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
            <Tab key={id} id={id} aria-controls={id} label={label} />
          ))}
        </Tabs>
        {!!enterprise && <EnterpriseDelete {...{ enterprise }} />}
      </div>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {steps
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
