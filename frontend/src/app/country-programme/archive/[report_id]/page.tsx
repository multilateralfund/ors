import type { Metadata } from 'next'

import CPView from '@ors/components/manage/Blocks/CountryProgramme/CPView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Country programme',
}

export default async function CountryProgrammeReport(props: {
  params: {
    report_id: string
  }
}) {
  return (
    <PageWrapper>
      <CPView id={props.params.report_id} archive />
    </PageWrapper>
  )
}
