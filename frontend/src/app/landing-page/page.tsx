import LandingPage from '@ors/components/manage/Blocks/LandingPage/LandingPage'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle.tsx'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import usePageTitle from '@ors/hooks/usePageTitle'

export default function LandingPageWrapper() {
  usePageTitle('Applications in the KMS')

  return (
    <PageWrapper>
      <HeaderTitle>
        <PageHeading className="min-w-fit">
          Applications in the Knowledge Management System
        </PageHeading>
      </HeaderTitle>
      <LandingPage />
    </PageWrapper>
  )
}
