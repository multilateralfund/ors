import { useEffect, useState } from 'react'

import { useParams } from 'wouter'

import { CPVersionInfo, Country } from '@ors/types/store'

import usePageTitle from '@ors/hooks/usePageTitle'

import CPDiffViewWrapper from '@ors/components/manage/Blocks/CountryProgramme/CPViewDiff'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import api from '@ors/helpers/Api/_api'

function useCountries() {
  const [countries, setCountries] = useState<Country[]>([])

  useEffect(function () {
    async function fetchCountries() {
      const resp =
        (await api<Country[]>(
          'api/countries/',
          { params: { with_cp_report: true } },
          false,
        )) || []
      setCountries(resp)
    }
    fetchCountries()
  }, [])

  return countries
}

function useVersions(country: Country, year: string) {
  const [versions, setVersions] = useState<CPVersionInfo[]>([])

  useEffect(
    function () {
      async function fetchVersions(country: Country, year: string) {
        const resp =
          (await api<CPVersionInfo[]>(
            'api/country-programme/versions',
            { params: { country_id: country.id, year } },
            false,
          )) || []
        setVersions(resp)
      }
      if (country && year) {
        fetchVersions(country, year)
      }
    },
    [country, year],
  )

  return versions
}

export default function CountryProgrammeReportDiff() {
  usePageTitle('Country programme diff')
  const params = useParams<Record<string, string>>()
  const { iso3, year } = params
  const version = parseInt(params.version, 10)

  const countries = useCountries()
  const country = countries.filter((country) => country.iso3 === iso3)[0]

  const versions = useVersions(country, year)

  const report_id = versions?.filter((ver) => ver.version == version).pop()?.id
  const isLastVersion = version === versions.length

  return (
    <PageWrapper>
      {report_id ? (
        <CPDiffViewWrapper
          country_id={country.id}
          report_id={!isLastVersion ? report_id : undefined}
          version={version}
          year={parseInt(year, 10)}
        />
      ) : null}
    </PageWrapper>
  )
}
