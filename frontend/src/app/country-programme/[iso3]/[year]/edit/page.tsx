import { useParams } from 'wouter'

import usePageTitle from '@ors/hooks/usePageTitle'

import CPEdit from '@ors/components/manage/Blocks/CountryProgramme/CPEdit'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function CountryProgrammeReport() {
  usePageTitle('Country programme')
  const { iso3, year } = useParams<Record<string, string>>()
  return (
    <PageWrapper>
      <CPEdit iso3={iso3} year={parseInt(year, 10)} />
    </PageWrapper>
  )
}
