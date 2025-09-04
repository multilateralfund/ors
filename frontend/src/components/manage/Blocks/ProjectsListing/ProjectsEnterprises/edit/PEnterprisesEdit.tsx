'use client'

import { useEffect, useState } from 'react'

import PEnterpriseHeader from '../create/PEnterpriseHeader'
import PEnterpriseCreate from '../create/PEnterpriseCreate'
import ProjectFormFooter from '../../ProjectFormFooter'
import { EnterpriseData, EnterpriseType } from '../../interfaces'
import {
  initialFundingDetailsFields,
  initialOverviewFields,
  initialRemarksFields,
} from '../../constants'

import { useParams } from 'wouter'

const PEnterprisesEdit = ({ enterprise }: { enterprise: EnterpriseType }) => {
  const { project_id } = useParams<Record<string, string>>()

  const [enterpriseData, setEnterpriseData] = useState<EnterpriseData>({
    overview: initialOverviewFields,
    substance_details: [],
    funding_details: initialFundingDetailsFields,
    remarks: initialRemarksFields,
  })

  const [enterpriseId, setEnterpriseId] = useState<number | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)

  const [errors, setErrors] = useState<{ [key: string]: [] }>({})
  const [otherErrors, setOtherErrors] = useState<string>('')
  const nonFieldsErrors = errors?.['non_field_errors'] || []

  useEffect(() => {
    setEnterpriseData((prevData) => ({
      ...prevData,
      overview: {
        enterprise: enterprise.enterprise,
        location: enterprise.location,
        application: enterprise.application,
        local_ownership: enterprise.local_ownership,
        export_to_non_a5: enterprise.export_to_non_a5,
      },
      substance_details: enterprise.ods_odp,
      funding_details: {
        capital_cost_approved: enterprise.capital_cost_approved,
        operating_cost_approved: enterprise.operating_cost_approved,
        funds_disbursed: enterprise.funds_disbursed,
      },
      remarks: { remarks: enterprise.remarks },
    }))
  }, [])

  return (
    <>
      <PEnterpriseHeader
        mode="edit"
        {...{
          enterpriseData,
          setEnterpriseId,
          enterprise,
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
          hasSubmitted,
          errors,
        }}
      />
      <ProjectFormFooter
        id={enterpriseId}
        href={`/projects-listing/enterprises/${project_id}/view/${enterpriseId}`}
        successMessage={'Enterprise was updated successfully.'}
        successRedirectMessage="View enterprise."
        {...{ nonFieldsErrors, otherErrors }}
      />
    </>
  )
}

export default PEnterprisesEdit
