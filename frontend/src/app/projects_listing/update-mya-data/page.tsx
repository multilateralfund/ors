import { PageHeading } from '@ors/components/ui/Heading/Heading'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import usePageTitle from '@ors/hooks/usePageTitle'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle.tsx'
import { RedirectBackButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents.tsx'
import UpdateMyaData from '@ors/components/manage/Blocks/ProjectsListing/UpdateMyaData/UpdateMyaData.tsx'

export default function ProjectsUpdateMyaDataPage() {
  usePageTitle('Projects - Update MYA data')
  return (
    <PageWrapper>
      <HeaderTitle>
        <div className="flex flex-col">
          <RedirectBackButton />
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <PageHeading className="min-w-fit">
              IA/BA Portal - Update MYA data
            </PageHeading>
          </div>
        </div>
      </HeaderTitle>
      <UpdateMyaData />
    </PageWrapper>
  )
}
