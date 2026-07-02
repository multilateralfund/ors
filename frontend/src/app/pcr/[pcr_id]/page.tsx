import PCRViewWrapper from '@ors/components/manage/Blocks/PCR/view/PCRViewWrapper'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function PCRView() {
  usePageTitle('PCR view')

  return (
    <PageWrapper>
      <PCRViewWrapper />
    </PageWrapper>
  )
}
