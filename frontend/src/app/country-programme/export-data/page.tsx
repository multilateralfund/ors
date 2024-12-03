import usePageTitle from '@ors/hooks/usePageTitle'

import CPExport from '@ors/components/manage/Blocks/CountryProgramme/CPExport'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export default function CPExportData() {
  usePageTitle('Export data')
  return (
    <PageWrapper className="mx-auto max-w-screen-xl">
      <HeaderTitle>
        <div className="container mx-auto max-w-screen-xl">
          <PageHeading>Export data on Country Programme reports</PageHeading>
        </div>
      </HeaderTitle>
      <CPExport />
    </PageWrapper>
  )
}
