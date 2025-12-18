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
  initialDetailsFields,
  initialSubstanceFields,
  initialFundingDetailsFields,
  initialRemarksFields,
} from '../constants.ts'

import { Redirect, useParams } from 'wouter'

const PEnterpriseCreateWrapper = () => {
  const { canViewProjects, canViewEnterprises, canEditProjectEnterprise } =
    useContext(PermissionsContext)

  const { project_id } = useParams<Record<string, string>>()
  const project = useGetProject(project_id)
  const { data, loading, error } = project ?? {}

  const [enterpriseData, setEnterpriseData] = useState<PEnterpriseData>({
    overview: { ...initialOverviewFields, id: null },
    details: initialDetailsFields,
    substance_fields: initialSubstanceFields,
    substance_details: [],
    funding_details: initialFundingDetailsFields,
    remarks: initialRemarksFields,
  })
  const [enterpriseId, setEnterpriseId] = useState<number | null>(null)

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
      details: {
        ...prevData['details'],
        agency: data?.agency_id,
        project_type: data?.project_type_id,
        planned_completion_date: data?.project_end_date,
        meeting: data?.meeting_id,
      },
    }))
  }, [data])

  if (
    !canViewProjects ||
    !canViewEnterprises ||
    !canEditProjectEnterprise ||
    (project && (error || (data && data.submission_status !== 'Approved')))
  ) {
    return <Redirect to="/projects-listing/listing" />
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
            }}
          />
          <PEnterpriseCreate
            projectData={data}
            {...{
              enterpriseData,
              setEnterpriseData,
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
