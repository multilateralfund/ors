import type { Metadata } from 'next'

import CPReportViewPrint from '@ors/components/manage/Blocks/CountryProgramme/CPReportViewPrint'
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
      <CPReportViewPrint id={props.params.report_id} />
    </PageWrapper>
  )
}
