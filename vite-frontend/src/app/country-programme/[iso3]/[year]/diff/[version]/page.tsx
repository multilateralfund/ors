import { CPVersionInfo, Country } from '@ors/types/store'
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
    version: string
    year: string
  }
}) {
  const { iso3, year } = props.params
  const version = parseInt(props.params.version, 10)

  const countries =
    (await api<Country[]>(
      'api/countries/',
      { params: { with_cp_report: true } },
      false,
    )) || []

  const country = countries.filter((country) => country.iso3 === iso3)[0]

  const versions =
    (await api<CPVersionInfo[]>(
      'api/country-programme/versions',
      { params: { country_id: country.id, year } },
      false,
    )) || []

  const report_id = versions.filter((ver) => ver.version == version).pop()!.id
  const isLastVersion = version === versions.length

  return (
    <PageWrapper>
      <CPDiffViewWrapper
        country_id={country.id}
        report_id={!isLastVersion ? report_id : undefined}
        version={version}
        year={parseInt(year, 10)}
      />
    </PageWrapper>
  )
}
