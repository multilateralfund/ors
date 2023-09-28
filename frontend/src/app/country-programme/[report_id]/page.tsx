import type { Metadata } from 'next'

import CPReportView from '@ors/components/manage/Blocks/CountryProgramme/CPReportView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import api from '@ors/helpers/Api/Api'

export const metadata: Metadata = {
  title: 'Country programme',
}

type ReportProps = {
  params: {
    report_id: string
  }
}

export default async function CountryProgrammeReport({ params }: ReportProps) {
  const report = await api(
    `api/country-programme/records/?cp_report_id=${params.report_id}`,
    {},
    false,
  )
  const admForm = await api(
    `api/country-programme/adm/empty-form/?cp_report_id=${params.report_id}`,
    {},
    false,
  )
  return (
    <PageWrapper>
      <CPReportView admForm={admForm || {}} report={report || {}} />
    </PageWrapper>
  )
}
