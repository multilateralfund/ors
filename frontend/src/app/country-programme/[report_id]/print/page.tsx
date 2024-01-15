import type { Metadata } from 'next'

import CPViewPrint from '@ors/components/manage/Blocks/CountryProgramme/CPViewPrint'

export const metadata: Metadata = {
  title: 'Country programme',
}

export default async function CountryProgrammeReport(props: {
  params: {
    report_id: string
  }
}) {
  return <CPViewPrint id={props.params.report_id} />
}
