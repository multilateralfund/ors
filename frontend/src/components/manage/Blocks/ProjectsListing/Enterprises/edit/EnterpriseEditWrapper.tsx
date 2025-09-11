'use client'

import { useContext } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import EnterprisesEdit from './EnterprisesEdit'
import { useGetProjectEnterprise } from '../../hooks/useGetProjectEnterprise'

import { Redirect, useParams } from 'wouter'

const EnterpriseEditWrapper = () => {
  const { canEditEnterprise, canViewProjects } = useContext(PermissionsContext)

  const { enterprise_id } = useParams<Record<string, string>>()

  const enterprise = useGetProjectEnterprise(enterprise_id)
  const { data, loading } = enterprise

  if (!canViewProjects) {
    return <Redirect to="/projects-listing/listing" />
  }

  if (!canEditEnterprise || enterprise?.error) {
    return <Redirect to="projects-listing/enterprises" />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && <EnterprisesEdit enterprise={data} />}
    </>
  )
}

export default EnterpriseEditWrapper
