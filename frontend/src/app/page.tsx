import type { Metadata } from 'next'

import { Box, Typography } from '@mui/material'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function Dashboard() {
  return (
    <PageWrapper>
      <Box>
        <Typography>Dashboard</Typography>
      </Box>
    </PageWrapper>
  )
}
