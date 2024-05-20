import { Country } from '@ors/types/store'
import type { Metadata } from 'next'

import CPDiffViewWrapper from '@ors/components/manage/Blocks/CountryProgramme/CPViewDiff'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import api from '@ors/helpers/Api/_api'

export const metadata: Metadata = {
  title: 'Country programme diff',
}

export default async function CountryProgrammeReportDiff(props: {
  params: {
    iso3: string
    year: string
  }
}) {
  const { iso3, year } = props.params

  const countries =
    (await api<Country[]>(
      'api/countries/',
      { params: { with_cp_report: true } },
      false,
    )) || []

  const country = countries.filter((country) => country.iso3 === iso3)[0]

  /*
  const versions =
    (await api<CPVersionInfo[]>(
      'api/country-programme/versions',
      { params: { country_id: country.id, year } },
      false,
    )) || []

  const version_numbers = versions.map((ver) => ver.version)
  const max_version = Math.max(...version_numbers)
  const id = versions.filter((ver) => ver.version == max_version - 1).pop()!.id
  */

  return (
    <PageWrapper>
      <CPDiffViewWrapper iso3={country.iso3} year={parseInt(year, 10)} />
    </PageWrapper>
  )
}
