import CPListing from '@ors/components/manage/Blocks/CountryProgramme/CPListing'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export default function CountryProgramme() {
  return (
    <PageWrapper className="max-w-screen-xl lg:px-0">
      <HeaderTitle>
        <PageHeading className="mx-auto max-w-screen-xl">
          Country programmes
        </PageHeading>
      </HeaderTitle>
      <CPListing />
    </PageWrapper>
  )
}
