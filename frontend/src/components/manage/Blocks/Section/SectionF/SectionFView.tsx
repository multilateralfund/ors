/* eslint-disable @typescript-eslint/no-unused-vars */
import { Box } from '@mui/material'

import { getResults } from '@ors/helpers/Api/Api'

export default function SectionFView(props: {
  report: Record<string, Array<any>>
}) {
  const { report } = props

  const { results } = getResults(report.section_f)

  return (
    <Box>
      <h2>Comments by bilateral/implementing agencies</h2>
    </Box>
  )
}
