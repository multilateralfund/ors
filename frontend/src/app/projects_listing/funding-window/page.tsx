import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle.tsx'
import { RedirectBackButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents.tsx'
import FundingWindow from '@ors/components/manage/Blocks/ProjectsListing/FundingWindow/FundingWindow.tsx'

export default function FundingWindowPage() {
  usePageTitle('Projects - Funding window')

  return (
    <PageWrapper>
      <HeaderTitle>
        <div className="flex flex-col">
          <RedirectBackButton />
          <div className="flex flex-wrap justify-between gap-2 sm:flex-nowrap">
            <PageHeading className="min-w-fit">
              IA/BA Portal - Funding window
            </PageHeading>
          </div>
        </div>
      </HeaderTitle>
      <FundingWindow />
    </PageWrapper>
  )
}
