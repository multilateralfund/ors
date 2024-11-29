import { useParams } from 'wouter'

import usePageTitle from '@ors/hooks/usePageTitle'

import CPViewPrint from '@ors/components/manage/Blocks/CountryProgramme/CPViewPrint'

export default function CountryProgrammeReport() {
  usePageTitle('Country programme')
  const { iso3, year } = useParams<Record<string, string>>()
  return <CPViewPrint iso3={iso3} year={parseInt(year, 10)} />
}
