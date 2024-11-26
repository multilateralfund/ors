import { useParams } from "wouter";

import CPView from '@ors/components/manage/Blocks/CountryProgramme/CPView'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

// export const metadata: Metadata = {
//   title: 'Country programme',
// }

export default function CountryProgrammeReport() {
  const { iso3, year } = useParams()

  return (
    <PageWrapper>
      <CPView iso3={iso3} year={parseInt(year, 10)} />
    </PageWrapper>
  )
}
