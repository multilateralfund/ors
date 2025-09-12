'use client'

import { useContext, useState } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import EnterpriseHeader from './EnterpriseHeader.tsx'
import EnterpriseCreate from './EnterpriseCreate.tsx'
import ProjectFormFooter from '../../ProjectFormFooter.tsx'
import { initialOverviewFields } from '../../constants.ts'
import { EnterpriseOverview } from '../../interfaces.ts'
import { useStore } from '@ors/store.tsx'

import { Redirect } from 'wouter'

const EnterpriseCreateWrapper = () => {
  const { canEditEnterprise } = useContext(PermissionsContext)

  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data

  const [enterpriseData, setEnterpriseData] = useState<EnterpriseOverview>({
    ...initialOverviewFields,
    agencies: agency_id ? [agency_id] : [],
  })
  const [enterpriseId, setEnterpriseId] = useState<number | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)

  const [errors, setErrors] = useState<{ [key: string]: string[] }>({})
  const [otherErrors, setOtherErrors] = useState<string>('')
  const nonFieldsErrors = errors?.['non_field_errors'] || []

  if (!canEditEnterprise) {
    return <Redirect to="/projects-listing/enterprises" />
  }

  return (
    <>
      <EnterpriseHeader
        mode="add"
        {...{
          enterpriseData,
          setEnterpriseId,
          setHasSubmitted,
          setErrors,
          setOtherErrors,
        }}
      />
      <EnterpriseCreate
        {...{
          enterpriseData,
          setEnterpriseData,
          hasSubmitted,
          errors,
        }}
      />
      <ProjectFormFooter
        id={enterpriseId}
        href={`/projects-listing/enterprises/${enterpriseId}`}
        successMessage="Enterprise was created successfully."
        successRedirectMessage="View enterprise."
        {...{ nonFieldsErrors, otherErrors }}
      />
    </>
  )
}

export default EnterpriseCreateWrapper
