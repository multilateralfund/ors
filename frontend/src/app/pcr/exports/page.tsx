import { useContext } from 'react'

import PCRExportStatus from '@ors/components/manage/Blocks/PCR/PCRExport/PCRExportStatus'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'

import { Redirect, useParams } from 'wouter'

export default function PCRExportPage() {
  usePageTitle('PCR export')

  const { export_id } = useParams<Record<string, string>>()
  const { canViewPCR } = useContext(PermissionsContext)

  if (!canViewPCR) {
    return <Redirect to="/projects-listing/listing" />
  }

  return (
    <PageWrapper>
      <PCRExportStatus exportId={export_id} />
    </PageWrapper>
  )
}
