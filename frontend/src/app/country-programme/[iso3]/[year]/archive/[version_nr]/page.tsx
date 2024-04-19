import { CPVersionInfo, Country } from '@ors/types/store'
import type { Metadata } from 'next'

import { CPArchiveViewWrapper } from '@ors/components/manage/Blocks/CountryProgramme/CPView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import api from '@ors/helpers/Api/_api'

export const metadata: Metadata = {
  title: 'Country programme',
}

export default async function CountryProgrammeReport(props: {
  params: {
    iso3: string
    version_nr: string
    year: string
  }
}) {
  const { iso3, year } = props.params
  const version_nr = parseInt(props.params.version_nr, 10)

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

  const id = versions.filter((ver) => ver.version == version_nr).pop()!.id

  return (
    <PageWrapper>
      <CPArchiveViewWrapper id={id} />
    </PageWrapper>
  )
}
