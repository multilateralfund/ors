import { useContext } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import PEnterpriseEdit from './PEnterpriseEdit'
import { useGetProjectEnterprise } from '../../hooks/useGetProjectEnterprise'
import { useGetProject } from '../../hooks/useGetProject'

import { Redirect, useParams } from 'wouter'

const PEnterpriseEditWrapper = () => {
  const {
    canViewProjects,
    canViewEnterprises,
    canEditProjectEnterprise,
    canApproveProjectEnterprise,
  } = useContext(PermissionsContext)

  const { project_id, enterprise_id } = useParams<Record<string, string>>()
  const project = useGetProject(project_id)
  const {
    data: projectData,
    loading: projectLoading,
    error: projectError,
  } = project ?? {}

  const enterprise = useGetProjectEnterprise(enterprise_id)
  const { data, loading, error } = enterprise

  if (
    !canViewProjects ||
    !canViewEnterprises ||
    (project &&
      (projectError ||
        (projectData && projectData.submission_status !== 'Approved')))
  ) {
    return <Redirect to="/projects-listing/listing" />
  }

  if (
    !(
      canEditProjectEnterprise ||
      (canApproveProjectEnterprise &&
        (data?.status !== 'Approved' || canEditProjectEnterprise))
    ) ||
    error
  ) {
    return (
      <Redirect
        to={`/projects-listing/projects-enterprises/${project_id}/view/${enterprise_id}`}
      />
    )
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading || projectLoading}
      />
      {!loading && !projectLoading && data && projectData && (
        <PEnterpriseEdit enterprise={data} projectData={projectData} />
      )}
    </>
  )
}

export default PEnterpriseEditWrapper
