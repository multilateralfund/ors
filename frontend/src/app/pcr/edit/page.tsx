import { useContext } from 'react'

import PCREditWrapper from '@ors/components/manage/Blocks/PCR/PCREdit/PCREditWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import PermissionsContext from '@ors/contexts/PermissionsContext'

import { Redirect } from 'wouter'

export default function PCREdit() {
  const { canEditPCR } = useContext(PermissionsContext)

  if (!canEditPCR) {
    return <Redirect to="/pcr" />
  }

  return (
    <PageWrapper>
      <PCREditWrapper />
    </PageWrapper>
  )
}
