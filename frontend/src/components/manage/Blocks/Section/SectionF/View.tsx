import { Box, Typography } from '@mui/material'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'

export default function SectionFView(props: { report: Record<string, any> }) {
  const { report } = props

  return (
    <>
      <HeaderTitle>
        {report.name && (
          <Typography className="mb-4 text-white" component="h1" variant="h5">
            {report.name}
          </Typography>
        )}
        <Typography className="text-white" component="h1" variant="h6">
          SECTION F. COMMENTS BY BILATERAL/IMPLEMENTING AGENCIES
        </Typography>
      </HeaderTitle>
      <Box>
        <Typography>{report.section_f?.remarks || 'No comments'}</Typography>
      </Box>
    </>
  )
}
