import { useEffect, useState } from 'react'

import EnterpriseHeader from '../create/EnterpriseHeader'
import EnterpriseCreate from '../create/EnterpriseCreate'
import ProjectFormFooter from '../../ProjectFormFooter'
import { EnterpriseData, EnterpriseType } from '../../interfaces'
import { getFormattedDecimalValue } from '../../utils'
import {
  initialOverviewFields,
  initialDetailsFields,
  initialSubstanceFields,
  initialFundingDetailsFields,
  initialRemarksFields,
} from '../constants'

const EnterpriseEdit = ({ enterprise }: { enterprise: EnterpriseType }) => {
  const [enterpriseData, setEnterpriseData] = useState<EnterpriseData>({
    overview: initialOverviewFields,
    details: initialDetailsFields,
    substance_fields: initialSubstanceFields,
    substance_details: [],
    funding_details: initialFundingDetailsFields,
    remarks: initialRemarksFields,
  })
  const [enterpriseId, setEnterpriseId] = useState<number | null>(null)

  const [errors, setErrors] = useState<{ [key: string]: string[] }>({})
  const [otherErrors, setOtherErrors] = useState<string>('')
  const nonFieldsErrors = errors?.['non_field_errors'] || []

  useEffect(() => {
    setEnterpriseData((prevData) => ({
      ...prevData,
      overview: {
        name: enterprise.name,
        country: enterprise.country,
        location: enterprise.location,
        city: enterprise.city,
        stage: enterprise.stage,
        sector: enterprise.sector,
        subsector: enterprise.subsector,
        application: enterprise.application,
        local_ownership: getFormattedDecimalValue(enterprise.local_ownership),
        export_to_non_a5: getFormattedDecimalValue(enterprise.export_to_non_a5),
        revision: enterprise.revision,
        date_of_revision: enterprise.date_of_revision,
        status: enterprise.status,
      },
      details: {
        agency: enterprise.agency,
        project_type: enterprise.project_type,
        planned_completion_date: enterprise.planned_completion_date,
        actual_completion_date: enterprise.actual_completion_date,
        project_duration: enterprise.project_duration,
        date_of_approval: enterprise.date_of_approval,
        meeting: enterprise.meeting,
        excom_provision: enterprise.excom_provision,
        date_of_report: enterprise.date_of_report,
      },
      substance_fields: {
        chemical_phased_out: getFormattedDecimalValue(
          enterprise.chemical_phased_out,
        ),
        impact: getFormattedDecimalValue(enterprise.impact),
      },
      substance_details: enterprise.ods_odp,
      funding_details: {
        capital_cost_approved: getFormattedDecimalValue(
          enterprise.capital_cost_approved,
        ),
        operating_cost_approved: getFormattedDecimalValue(
          enterprise.operating_cost_approved,
        ),
        funds_disbursed: getFormattedDecimalValue(enterprise.funds_disbursed),
        funds_approved: getFormattedDecimalValue(enterprise.funds_approved),
        cost_effectiveness_approved: getFormattedDecimalValue(
          enterprise.cost_effectiveness_approved,
        ),
        funds_transferred: getFormattedDecimalValue(
          enterprise.funds_transferred,
        ),
        cost_effectiveness_actual: getFormattedDecimalValue(
          enterprise.cost_effectiveness_actual,
        ),
        capital_cost_disbursed: getFormattedDecimalValue(
          enterprise.capital_cost_disbursed,
        ),
        operating_cost_disbursed: getFormattedDecimalValue(
          enterprise.operating_cost_disbursed,
        ),
        co_financing_planned: getFormattedDecimalValue(
          enterprise.co_financing_planned,
        ),
        co_financing_actual: getFormattedDecimalValue(
          enterprise.co_financing_actual,
        ),
      },
      remarks: {
        agency_remarks: enterprise.agency_remarks,
        secretariat_remarks: enterprise.secretariat_remarks,
      },
    }))
  }, [])

  return (
    <>
      <EnterpriseHeader
        mode="edit"
        {...{
          enterpriseData,
          enterprise,
          setEnterpriseId,
          setErrors,
          setOtherErrors,
        }}
      />
      <EnterpriseCreate
        mode="edit"
        {...{
          enterpriseData,
          setEnterpriseData,
          enterprise,
          errors,
        }}
      />
      <ProjectFormFooter
        id={enterpriseId}
        href={`/projects-listing/enterprises/${enterpriseId}`}
        successMessage="Enterprise was updated successfully."
        successRedirectMessage="View enterprise."
        {...{ nonFieldsErrors, otherErrors }}
      />
    </>
  )
}

export default EnterpriseEdit
