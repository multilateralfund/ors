'use client'

import { useEffect, useState } from 'react'

import PEnterpriseHeader from '../create/PEnterpriseHeader'
import PEnterpriseCreate from '../create/PEnterpriseCreate'
import ProjectFormFooter from '../../ProjectFormFooter'
import { PEnterpriseData, PEnterpriseType } from '../../interfaces'
import {
  initialOverviewFields,
  initialFundingDetailsFields,
} from '../../constants'

import { useParams } from 'wouter'

const PEnterpriseEdit = ({
  enterprise,
  countryId,
}: {
  enterprise: PEnterpriseType
  countryId: number
}) => {
  const { project_id } = useParams<Record<string, string>>()

  const [enterpriseData, setEnterpriseData] = useState<PEnterpriseData>({
    overview: initialOverviewFields,
    substance_details: [],
    funding_details: initialFundingDetailsFields,
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
        name: enterpriseObj.name,
        agencies: enterpriseObj.agencies,
        country: enterpriseObj.country,
        location: enterpriseObj.location,
        application: enterpriseObj.application,
        local_ownership: enterpriseObj.local_ownership,
        export_to_non_a5: enterpriseObj.export_to_non_a5,
        remarks: enterpriseObj.remarks,
      },
      substance_details: enterprise.ods_odp,
      funding_details: {
        capital_cost_approved: enterprise.capital_cost_approved,
        operating_cost_approved: enterprise.operating_cost_approved,
        funds_disbursed: enterprise.funds_disbursed,
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

export default PEnterpriseEdit
