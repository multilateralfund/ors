import type { Metadata } from 'next'

import CPEdit from '@ors/components/manage/Blocks/CountryProgramme/CPEdit'
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
      <CPEdit id={props.params.report_id} />
    </PageWrapper>
  )
}
