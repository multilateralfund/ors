import { useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'

import { Redirect, useParams } from 'wouter'

const PCREditWrapper = () => {
  const { canViewPCR, canEditPCR } = useContext(PermissionsContext)

  const { project_id } = useParams<Record<string, string>>()

  if (!canViewPCR) {
    return <Redirect to="/projects-listing/listing" />
  }

  if (!canEditPCR) {
    return <Redirect to={`/pcr/${project_id}`} />
  }

  return <>edit {project_id}</>
}

export default PCREditWrapper
