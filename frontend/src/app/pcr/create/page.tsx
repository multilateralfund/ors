import PCRCreateWrapper from '@ors/components/manage/Blocks/PCR/create/PCRCreateWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function PCRCreate() {
  usePageTitle('PCR create')

  return (
    <PageWrapper>
      <PCRCreateWrapper />
    </PageWrapper>
  )
}
