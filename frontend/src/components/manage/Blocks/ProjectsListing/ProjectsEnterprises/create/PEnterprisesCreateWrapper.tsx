'use client'

import { useContext, useEffect, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading.tsx'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import PEnterpriseHeader from './PEnterpriseHeader.tsx'
import PEnterpriseCreate from './PEnterpriseCreate.tsx'
import ProjectFormFooter from '../../ProjectFormFooter.tsx'
import { useGetProject } from '../../hooks/useGetProject.ts'
import { EnterpriseData } from '../../interfaces.ts'
import {
  initialFundingDetailsFields,
  initialOverviewFields,
  initialRemarksFields,
} from '../../constants.ts'

import { Redirect, useParams } from 'wouter'

const PEnterprisesCreateWrapper = () => {
  const { canEditEnterprise, canViewProjects } = useContext(PermissionsContext)

  const { project_id } = useParams<Record<string, string>>()
  const project = project_id ? useGetProject(project_id) : undefined
  const { data, error, loading } = project ?? {}

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
        ...prevData['overview'],
        country: data?.country_id,
      },
    }))
  }, [data])

  if (
    !project_id ||
    !canViewProjects ||
    (project && (error || (data && data.submission_status !== 'Approved')))
  ) {
    return <Redirect to="/projects-listing/listing" />
  }

  if (!canEditEnterprise) {
    return (
      <Redirect to={`/projects-listing/projects-enterprises/${project_id}`} />
    )
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && (
        <>
          <PEnterpriseHeader
            mode="add"
            {...{
              enterpriseData,
              setEnterpriseId,
              setErrors,
              setOtherErrors,
              setHasSubmitted,
            }}
          />
          <PEnterpriseCreate
            {...{
              enterpriseData,
              setEnterpriseData,
              errors,
              hasSubmitted,
            }}
            countryId={data.country_id}
          />
          <ProjectFormFooter
            id={enterpriseId}
            href={`/projects-listing/projects-enterprises/${project_id}/view/${enterpriseId}`}
            successMessage="Enterprise was created successfully."
            successRedirectMessage="View project enterprise."
            {...{ nonFieldsErrors, otherErrors }}
          />
        </>
      )}
    </>
  )
}

export default PEnterprisesCreateWrapper
