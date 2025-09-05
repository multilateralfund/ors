'use client'

import { useContext } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PEnterprisesEdit from './PEnterprisesEdit'
import { useGetEnterprise } from '../../hooks/useGetEnterprise'
import { useGetProject } from '../../hooks/useGetProject'

import { Redirect, useParams } from 'wouter'

const PEnterprisesEditWrapper = () => {
  const { canEditEnterprise, canViewProjects } = useContext(PermissionsContext)

  const { project_id, enterprise_id } = useParams<Record<string, string>>()
  const project = project_id ? useGetProject(project_id) : undefined
  const { data: projectData, error, loading: loadingProject } = project ?? {}

  const enterprise = useGetEnterprise(enterprise_id)
  const { data, loading } = enterprise

  if (
    !project_id ||
    !canViewProjects ||
    (project &&
      (error || (projectData && projectData.submission_status !== 'Approved')))
  ) {
    return <Redirect to="/projects-listing/listing" />
  }

  if (!canEditEnterprise || enterprise?.error) {
    return <Redirect to={`/projects-listing/enterprises/${project_id}`} />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading || loadingProject}
      />
      {!loading && !loadingProject && data && projectData && (
        <PEnterprisesEdit
          enterprise={data}
          countryId={projectData.country_id}
        />
      )}
    </>
  )
}

export default PEnterprisesEditWrapper
