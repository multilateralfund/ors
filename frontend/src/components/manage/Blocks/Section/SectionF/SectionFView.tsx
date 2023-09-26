/* eslint-disable @typescript-eslint/no-unused-vars */
import { Box, Typography } from '@mui/material'

import { getResults } from '@ors/helpers/Api/Api'

export default function SectionFView(props: {
  report: Record<string, Array<any>>
}) {
  const { report } = props

  const { results } = getResults(report.section_f)

  return (
    <Box>
      <Typography component="h1" variant="h5">
        Comments by bilateral/implementing agencies
      </Typography>
    </Box>
  )
}
