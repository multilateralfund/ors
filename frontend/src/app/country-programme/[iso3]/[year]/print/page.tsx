import type { Metadata } from 'next'

import CPViewPrint from '@ors/components/manage/Blocks/CountryProgramme/CPViewPrint'

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
  return <CPViewPrint iso3={iso3} year={parseInt(year, 10)} />
}
