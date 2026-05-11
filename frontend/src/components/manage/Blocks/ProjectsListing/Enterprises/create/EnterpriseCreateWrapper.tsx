import { useContext, useState } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import EnterpriseHeader from './EnterpriseHeader.tsx'
import EnterpriseCreate from './EnterpriseCreate.tsx'
import { EnterpriseData } from '../../interfaces.ts'
import {
  initialOverviewFields,
  initialDetailsFields,
  initialSubstanceFields,
  initialFundingDetailsFields,
  initialRemarksFields,
} from '../constants.ts'
import { useStore } from '@ors/store.tsx'

import { Redirect } from 'wouter'

const EnterpriseCreateWrapper = () => {
  const { canEditEnterprise } = useContext(PermissionsContext)

  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data

  const [enterpriseData, setEnterpriseData] = useState<EnterpriseData>({
    overview: { ...initialOverviewFields, agency: agency_id ?? null },
    details: initialDetailsFields,
    substance_fields: initialSubstanceFields,
    substance_details: [],
    funding_details: initialFundingDetailsFields,
    remarks: initialRemarksFields,
  })
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({})

  if (!canEditEnterprise) {
    return <Redirect to="/projects-listing/enterprises" />
  }

  return (
    <>
      <EnterpriseHeader
        mode="add"
        {...{
          enterpriseData,
          setErrors,
        }}
      />
      <EnterpriseCreate
        mode="add"
        {...{
          enterpriseData,
          setEnterpriseData,
          errors,
        }}
      />
    </>
  )
}

export default EnterpriseCreateWrapper
