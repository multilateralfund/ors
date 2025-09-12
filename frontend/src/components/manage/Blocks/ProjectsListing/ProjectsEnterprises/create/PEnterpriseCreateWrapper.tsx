'use client'

import { useContext, useEffect, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading.tsx'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import PEnterpriseHeader from './PEnterpriseHeader.tsx'
import PEnterpriseCreate from './PEnterpriseCreate.tsx'
import ProjectFormFooter from '../../ProjectFormFooter.tsx'
import { useGetProject } from '../../hooks/useGetProject.ts'
import { PEnterpriseData } from '../../interfaces.ts'
import {
  initialOverviewFields,
  initialFundingDetailsFields,
} from '../../constants.ts'

import { Redirect, useParams } from 'wouter'

const PEnterpriseCreateWrapper = () => {
  const { canViewProjects, canEditProjectEnterprise } =
    useContext(PermissionsContext)

  const { project_id } = useParams<Record<string, string>>()
  const project = project_id ? useGetProject(project_id) : undefined
  const { data, loading, error } = project ?? {}

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
    setEnterpriseData((prevData) => ({
      ...prevData,
      overview: {
        ...prevData['overview'],
        country: data?.country_id,
      },
    }))
  }, [data])

  if (
    !canViewProjects ||
    !project_id ||
    (project && (error || (data && data.submission_status !== 'Approved')))
  ) {
    return <Redirect to="/projects-listing/listing" />
  }

  if (!canEditProjectEnterprise) {
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
              setHasSubmitted,
              setErrors,
              setOtherErrors,
            }}
          />
          <PEnterpriseCreate
            countryId={data.country_id}
            {...{
              enterpriseData,
              setEnterpriseData,
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
      )}
    </>
  )
}

export default PEnterpriseCreateWrapper
