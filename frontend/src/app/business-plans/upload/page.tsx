import { useContext } from 'react'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import BPUpload from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/BPUpload'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import usePageTitle from '@ors/hooks/usePageTitle'
import NotFoundPage from '@ors/app/not-found'

export default function BusinessPlans() {
  usePageTitle('Business Plans Upload')

  const { canUploadBp, canViewBpYears } = useContext(PermissionsContext)

  if (!canUploadBp || !canViewBpYears) {
    return <NotFoundPage />
  }

  return (
    <PageWrapper>
      <BPUpload />
    </PageWrapper>
  )
}
