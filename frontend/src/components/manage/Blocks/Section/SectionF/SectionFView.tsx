import { useState } from 'react'

import { Box, Typography } from '@mui/material'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import LoadingBuffer from '@ors/components/theme/Loading/LoadingBuffer'

export default function SectionFView(props: { report: Record<string, any> }) {
  const { report } = props
  const [loading, setLoading] = useState(true)

  return (
    <>
      <HeaderTitle onInit={() => setLoading(false)}>
        <Typography className="text-white" component="h1" variant="h6">
          SECTION F. COMMENTS BY BILATERAL/IMPLEMENTING AGENCIES
        </Typography>
      </HeaderTitle>
      {loading && <LoadingBuffer className="relative" time={300} />}
      {!loading && (
        <Box>
          <Typography>{report.section_f?.remarks || 'No comments'}</Typography>
        </Box>
      )}
    </>
  )
}
