import { useContext, useState } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import EnterpriseHeader from './EnterpriseHeader.tsx'
import EnterpriseCreate from './EnterpriseCreate.tsx'
import ProjectFormFooter from '../../ProjectFormFooter.tsx'
import { initialOverviewFields } from '../../ProjectsEnterprises/constants.ts'
import { EnterpriseOverview } from '../../interfaces.ts'

import { Redirect } from 'wouter'

const EnterpriseCreateWrapper = () => {
  const { canEditEnterprise } = useContext(PermissionsContext)

  const [enterpriseData, setEnterpriseData] = useState<EnterpriseOverview>(
    initialOverviewFields,
  )
  const [enterpriseId, setEnterpriseId] = useState<number | null>(null)

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
          setErrors,
          setOtherErrors,
        }}
      />
      <EnterpriseCreate
        {...{
          enterpriseData,
          setEnterpriseData,
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
