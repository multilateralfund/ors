import type { Metadata } from 'next'

import CPReportView from '@ors/components/manage/Blocks/CountryProgramme/CPReportView'
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
      <CPReportView id={props.params.report_id} />
    </PageWrapper>
  )
}
