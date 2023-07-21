import type { Metadata } from 'next'

import { Box } from '@mui/material'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function Dashboard() {
  return (
    <Box className="mx-4 mt-4" component={PageWrapper}>
      <h1>Dashboard</h1>
    </Box>
  )
}
