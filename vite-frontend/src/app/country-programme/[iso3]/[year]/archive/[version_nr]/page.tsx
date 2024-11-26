import { useEffect, useState } from 'react'

import { useParams } from "wouter";

import { CPVersionInfo, Country } from '@ors/types/store'

import { CPArchiveViewWrapper } from '@ors/components/manage/Blocks/CountryProgramme/CPView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import api from '@ors/helpers/Api/_api'

// export const metadata: Metadata = {
//   title: 'Country programme',
// }

function useCountries() {
  const [countries, setCountries] = useState([])

  async function fetchCountries() {
    const resp = (await api<Country[]>(
      'api/countries/',
      { params: { with_cp_report: true } },
      false,
    )) || []
    setCountries(resp)
  }

  useEffect(function(){
    fetchCountries()
  }, [])

  return countries
}

function useVersions(country: Country, year: string) {
  const [versions, setVersions] = useState([])

  async function fetchVersions(country: Country, year: string) {
    const resp = (await api<CPVersionInfo[]>(
      'api/country-programme/versions',
      { params: { country_id: country.id, year } },
      false,
    )) || []
    setVersions(resp)
  }

  useEffect(function(){
    if (country && year) {
      fetchVersions(country, year)
    }
  }, [country, year])

  return versions
}

export default function CountryProgrammeReport() {
  const params = useParams()
  const { iso3, year } = params
  const version_nr = parseInt(params.version_nr, 10)

  const countries = useCountries()
  const country = countries.filter((country) => country.iso3 === iso3)[0]

  const versions = useVersions(country, year)
  const id = versions.filter((ver) => ver.version == version_nr).pop()?.id

  return (
    <PageWrapper>
      { id ? <CPArchiveViewWrapper id={id} /> : null }
    </PageWrapper>
  )
}
