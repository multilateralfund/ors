import type { Metadata } from 'next'

import CPEdit from '@ors/components/manage/Blocks/CountryProgramme/CPEdit'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Country programme',
}

export default async function CountryProgrammeReport(props: {
  params: {
    iso3: string
    year: string
  }
}) {
  const { iso3, year } = props.params
  return (
    <PageWrapper>
      <CPEdit iso3={iso3} year={parseInt(year, 10)} />
    </PageWrapper>
  )
}
