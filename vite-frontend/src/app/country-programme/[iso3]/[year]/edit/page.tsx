import { useParams } from 'wouter'

import CPEdit from '@ors/components/manage/Blocks/CountryProgramme/CPEdit'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

// export const metadata: Metadata = {
//   title: 'Country programme',
// }

export default function CountryProgrammeReport() {
  const { iso3, year } = useParams<Record<string, string>>()
  return (
    <PageWrapper>
      <CPEdit iso3={iso3} year={parseInt(year, 10)} />
    </PageWrapper>
  )
}
