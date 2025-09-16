'use client'

import { useContext } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import EnterpriseEdit from './EnterpriseEdit'
import { useGetEnterprise } from '../../hooks/useGetEnterprise'

import { Redirect, useParams } from 'wouter'

const EnterpriseEditWrapper = () => {
  const { canViewEnterprises, canEditEnterprise, canApproveEnterprise } =
    useContext(PermissionsContext)

  const { enterprise_id } = useParams<Record<string, string>>()
  const enterprise = useGetEnterprise(enterprise_id)
  const { data, loading, error } = enterprise

  if (!canViewEnterprises) {
    return <Redirect to="/projects-listing/listing" />
  }

  if (
    (!canEditEnterprise && !canApproveEnterprise) ||
    data?.status === 'Obsolete' ||
    error
  ) {
    return <Redirect to={`/projects-listing/enterprises/${enterprise_id}`} />
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      {!loading && data && <EnterpriseEdit enterprise={data} />}
    </>
  )
}

export default EnterpriseEditWrapper
