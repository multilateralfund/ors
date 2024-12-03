import usePageTitle from '@ors/hooks/usePageTitle'

import CPCreate from '@ors/components/manage/Blocks/CountryProgramme/CPCreate'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function CreateReport() {
  usePageTitle('Create report')
  return (
    <PageWrapper>
      <CPCreate />
    </PageWrapper>
  )
}
