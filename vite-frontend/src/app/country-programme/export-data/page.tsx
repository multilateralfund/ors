import React from 'react'

import CPExport from '@ors/components/manage/Blocks/CountryProgramme/CPExport'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

// export const metadata: Metadata = {
//   title: 'Export data',
// }

export default function CPExportData() {
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
