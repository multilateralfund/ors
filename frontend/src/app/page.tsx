import Box from '@mui/material/Box'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function Dashboard() {
  return (
    <Box component={PageWrapper} className="mx-4 mt-4">
      <h1>Dashboard</h1>
    </Box>
  )
}
