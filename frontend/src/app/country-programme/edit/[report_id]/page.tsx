import type { Metadata } from 'next'

import CPReportEdit from '@ors/components/manage/Blocks/CountryProgramme/CPReportEdit'
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
      <CPReportEdit id={props.params.report_id} />
    </PageWrapper>
  )
}
