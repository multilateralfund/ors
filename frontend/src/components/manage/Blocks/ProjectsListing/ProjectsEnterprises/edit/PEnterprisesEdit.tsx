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

const PEnterprisesEdit = ({
  enterprise,
  countryId,
}: {
  enterprise: EnterpriseType
  countryId: number
}) => {
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
    const { enterprise: enterpriseObj } = enterprise

    setEnterpriseData((prevData) => ({
      ...prevData,
      overview: {
        id: enterpriseObj.id,
        name: enterpriseObj.name,
        country: countryId || enterpriseObj.country,
        location: enterpriseObj.location,
        application: enterpriseObj.application,
        local_ownership: enterpriseObj.local_ownership,
        export_to_non_a5: enterpriseObj.export_to_non_a5,
      },
      substance_details: enterprise.ods_odp,
      funding_details: {
        capital_cost_approved: enterprise.capital_cost_approved,
        operating_cost_approved: enterprise.operating_cost_approved,
        funds_disbursed: enterprise.funds_disbursed,
      },
      remarks: { remarks: enterpriseObj.remarks },
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
          countryId,
          hasSubmitted,
          errors,
        }}
      />
      <ProjectFormFooter
        id={enterpriseId}
        href={`/projects-listing/projects-enterprises/${project_id}/view/${enterpriseId}`}
        successMessage={'Project enterprise was updated successfully.'}
        successRedirectMessage="View project enterprise."
        {...{ nonFieldsErrors, otherErrors }}
      />
    </>
  )
}

export default PEnterprisesEdit
