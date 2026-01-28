import React, { useContext } from 'react'
import { useAPRCurrentYear } from '@ors/contexts/AnnualProjectReport/APRContext.tsx'
import Loader from '@ors/components/manage/Blocks/ProjectReport/Loader.tsx'
import PermissionsContext from '@ors/contexts/PermissionsContext.tsx'
import NotFoundPage from '@ors/app/not-found.tsx'
import { Redirect } from 'wouter'

export default function AprRedirect() {
  const { data, loading } = useAPRCurrentYear()
  const { canViewAPR, isMlfsUser } = useContext(PermissionsContext)

  if (!data || loading) {
    return <Loader active />
  }

  if (!canViewAPR) {
    return <NotFoundPage />
  }

  if (isMlfsUser) {
    return <Redirect to={`/${data.current_year}/mlfs/workspace`} replace />
  }

  return <Redirect to={`/${data.current_year}/workspace`} replace />
}
