'use client'

import { useEffect, useState } from 'react'

import PEnterpriseHeader from './PEnterpriseHeader.tsx'
import PEnterpriseCreate from './PEnterpriseCreate.tsx'
import ProjectFormFooter from '../../ProjectFormFooter.tsx'
import { PEnterpriseData } from '../../interfaces.ts'
import {
  initialOverviewFields,
  initialFundingDetailsFields,
} from '../../constants.ts'
import { useStore } from '@ors/store.tsx'

import { useParams } from 'wouter'

const PEnterpriseCreateWrapper = ({ countryId }: { countryId: number }) => {
  const { project_id } = useParams<Record<string, string>>()

  const userSlice = useStore((state) => state.user)
  const { agency_id } = userSlice.data

  const [enterpriseData, setEnterpriseData] = useState<PEnterpriseData>({
    overview: {
      ...initialOverviewFields,
      agencies: agency_id ? [agency_id] : [],
    },
    substance_details: [],
    funding_details: initialFundingDetailsFields,
  })
  const [enterpriseId, setEnterpriseId] = useState<number | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false)

  const [errors, setErrors] = useState<{ [key: string]: string[] }>({})
  const [otherErrors, setOtherErrors] = useState<string>('')
  const nonFieldsErrors = errors?.['non_field_errors'] || []

  useEffect(() => {
    setEnterpriseData((prevData) => ({
      ...prevData,
      overview: {
        ...prevData['overview'],
        country: countryId,
      },
    }))
  }, [countryId])

  return (
    <>
      <PEnterpriseHeader
        mode="add"
        {...{
          enterpriseData,
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
          countryId,
          hasSubmitted,
          errors,
        }}
      />
      <ProjectFormFooter
        id={enterpriseId}
        href={`/projects-listing/projects-enterprises/${project_id}/view/${enterpriseId}`}
        successMessage="Project enterprise was created successfully."
        successRedirectMessage="View project enterprise."
        {...{ nonFieldsErrors, otherErrors }}
      />
    </>
  )
}

export default PEnterpriseCreateWrapper
