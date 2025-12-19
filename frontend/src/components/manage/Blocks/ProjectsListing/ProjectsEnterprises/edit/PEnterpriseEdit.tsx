'use client'

import { useEffect, useState } from 'react'

import PEnterpriseHeader from '../create/PEnterpriseHeader'
import PEnterpriseCreate from '../create/PEnterpriseCreate'
import ProjectFormFooter from '../../ProjectFormFooter'
import { useGetEnterpriseStatuses } from '../../hooks/useGetEnterpriseStatuses'
import { getFormattedDecimalValue } from '../../utils'
import {
  PEnterpriseData,
  PEnterpriseType,
  ProjectTypeApi,
} from '../../interfaces'
import {
  initialOverviewFields,
  initialDetailsFields,
  initialSubstanceFields,
  initialFundingDetailsFields,
  initialRemarksFields,
} from '../constants'

import { useParams } from 'wouter'

const PEnterpriseEdit = ({
  enterprise,
  projectData,
}: {
  enterprise: PEnterpriseType
  projectData: ProjectTypeApi
}) => {
  const { project_id } = useParams<Record<string, string>>()

  const enterpriseStatuses = useGetEnterpriseStatuses(false)

  const [enterpriseData, setEnterpriseData] = useState<PEnterpriseData>({
    overview: initialOverviewFields,
    details: initialDetailsFields,
    substance_fields: initialSubstanceFields,
    substance_details: [],
    funding_details: initialFundingDetailsFields,
    remarks: initialRemarksFields,
  })
  const [enterpriseId, setEnterpriseId] = useState<number | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)

  const [errors, setErrors] = useState<{ [key: string]: string[] }>({})
  const [otherErrors, setOtherErrors] = useState<string>('')
  const nonFieldsErrors = errors?.['non_field_errors'] || []

  useEffect(() => {
    const { enterprise: enterpriseObj } = enterprise

    setEnterpriseData((prevData) => ({
      ...prevData,
      overview: {
        id: enterpriseObj.id,
        status: enterpriseObj.status,
        linkStatus: enterprise.status,
        name: enterpriseObj.name,
        country: enterpriseObj.country,
        location: enterpriseObj.location,
        stage: enterpriseObj.stage,
        sector: enterpriseObj.sector,
        subsector: enterpriseObj.subsector,
        application: enterpriseObj.application,
        local_ownership: getFormattedDecimalValue(
          enterpriseObj.local_ownership,
        ),
        export_to_non_a5: getFormattedDecimalValue(
          enterpriseObj.export_to_non_a5,
        ),
        revision: enterpriseObj.revision,
        date_of_revision: enterpriseObj.date_of_revision,
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
      <PEnterpriseHeader
        mode="edit"
        {...{
          enterpriseData,
          enterprise,
          setEnterpriseId,
          setHasSubmitted,
          setErrors,
          setOtherErrors,
        }}
      />
      <PEnterpriseCreate
        {...{
          enterpriseData,
          setEnterpriseData,
          enterprise,
          enterpriseStatuses,
          projectData,
          hasSubmitted,
          errors,
        }}
      />
      <ProjectFormFooter
        id={enterpriseId}
        href={`/projects/projects-enterprises/${project_id}/view/${enterpriseId}`}
        successMessage={'Project enterprise was updated successfully.'}
        successRedirectMessage="View project enterprise."
        {...{ nonFieldsErrors, otherErrors }}
      />
    </>
  )
}

export default PEnterpriseEdit
