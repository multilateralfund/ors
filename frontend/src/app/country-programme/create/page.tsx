import React from 'react'

import CPCreate from '@ors/components/manage/Blocks/CountryProgramme/CPCreate'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

// export const metadata: Metadata = {
//   title: 'Create report',
// }

export default function CreateReport() {
  return (
    <PageWrapper>
      <CPCreate />
    </PageWrapper>
  )
}
