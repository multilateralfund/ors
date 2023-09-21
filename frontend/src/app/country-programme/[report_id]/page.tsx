import type { Metadata } from 'next'

import CountryProgramme from '@ors/components/CountryProgramme'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Country programme',
}

type ReportProps = {
  params: {
    report_id: string
  }
}

export default async function CountryProgrammeReport({ params }: ReportProps) {
  return (
    <PageWrapper>
      <CountryProgramme report_id={params.report_id} />
    </PageWrapper>
  )
}
