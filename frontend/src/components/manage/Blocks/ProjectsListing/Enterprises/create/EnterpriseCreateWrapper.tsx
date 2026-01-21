import { useContext, useEffect, useState } from 'react'

import { useUpdatedFields } from '@ors/contexts/Projects/UpdatedFieldsContext.tsx'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import EnterpriseHeader from './EnterpriseHeader.tsx'
import EnterpriseCreate from './EnterpriseCreate.tsx'
import ProjectFormFooter from '../../ProjectFormFooter.tsx'
import { initialOverviewFields } from '../../ProjectsEnterprises/constants.ts'
import { EnterpriseOverview } from '../../interfaces.ts'
import useVisibilityChange from '@ors/hooks/useVisibilityChange.ts'

import { Redirect } from 'wouter'

const EnterpriseCreateWrapper = () => {
  const { canEditEnterprise } = useContext(PermissionsContext)

  const { updatedFields, addUpdatedField, clearUpdatedFields } =
    useUpdatedFields()

  useEffect(() => {
    clearUpdatedFields()
  }, [])

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

  const setEnterpriseDataWithEditTracking = (
    updater: React.SetStateAction<EnterpriseOverview>,
    fieldName?: string,
  ) => {
    setEnterpriseData((prevData) => {
      if (fieldName) {
        addUpdatedField(fieldName)
      }

      return typeof updater === 'function'
        ? (updater as (prev: EnterpriseOverview) => EnterpriseOverview)(
            prevData,
          )
        : updater
    })
  }

  useVisibilityChange(updatedFields.size > 0)

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
          errors,
        }}
        setEnterpriseData={setEnterpriseDataWithEditTracking}
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
