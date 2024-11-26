import { useParams } from "wouter";

import CPViewPrint from '@ors/components/manage/Blocks/CountryProgramme/CPViewPrint'

// export const metadata: Metadata = {
//   title: 'Country programme',
// }

export default function CountryProgrammeReport() {
  const { iso3, year } = useParams()
  return <CPViewPrint iso3={iso3} year={parseInt(year, 10)} />
}
