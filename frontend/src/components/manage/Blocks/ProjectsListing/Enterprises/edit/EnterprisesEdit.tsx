'use client'

import { useEffect, useState } from 'react'

import EnterpriseHeader from '../create/EnterpriseHeader'
import EnterpriseCreate from '../create/EnterpriseCreate'
import ProjectFormFooter from '../../ProjectFormFooter'
import { EnterpriseOverview } from '../../interfaces'
import { initialOverviewFields } from '../../constants'

const EnterprisesEdit = ({
  enterprise,
}: {
  enterprise: EnterpriseOverview
}) => {
  const [enterpriseData, setEnterpriseData] = useState<EnterpriseOverview>(
    initialOverviewFields,
  )

  const [enterpriseId, setEnterpriseId] = useState<number | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)

  const [errors, setErrors] = useState<{ [key: string]: [] }>({})
  const [otherErrors, setOtherErrors] = useState<string>('')
  const nonFieldsErrors = errors?.['non_field_errors'] || []

  useEffect(() => {
    setEnterpriseData((prevData) => ({
      ...prevData,
      name: enterprise.name,
      country: enterprise.country,
      location: enterprise.location,
      application: enterprise.application,
      local_ownership: enterprise.local_ownership,
      export_to_non_a5: enterprise.export_to_non_a5,
      remarks: enterprise.remarks,
    }))
  }, [])

  return (
    <>
      <EnterpriseHeader
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
      <EnterpriseCreate
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
        href={`/projects-listing/enterprises/${enterpriseId}`}
        successMessage={'Enterprise was updated successfully.'}
        successRedirectMessage="View enterprise."
        {...{ nonFieldsErrors, otherErrors }}
      />
    </>
  )
}

export default EnterprisesEdit
