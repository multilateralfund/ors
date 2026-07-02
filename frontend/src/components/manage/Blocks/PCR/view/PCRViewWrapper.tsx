import { useContext, useMemo } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'

import { Redirect, useParams } from 'wouter'

const PCRViewWrapper = () => {
  const { canViewPCR } = useContext(PermissionsContext)

  const { project_id } = useParams<Record<string, string>>()

  if (!canViewPCR) {
    return <Redirect to="/projects-listing/listing" />
  }

  return <>view {project_id}</>
}

export default PCRViewWrapper
