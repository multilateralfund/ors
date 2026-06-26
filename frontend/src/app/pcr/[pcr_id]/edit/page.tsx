import PCREditWrapper from '@ors/components/manage/Blocks/PCR/edit/PCREditWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function PCREdit() {
  usePageTitle('PCR edit')

  return (
    <PageWrapper>
      <PCREditWrapper />
    </PageWrapper>
  )
}
