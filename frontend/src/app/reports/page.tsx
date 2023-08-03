import type { Metadata } from 'next'

import React from 'react'

import { Box, Button, Typography } from '@mui/material'

import ReportsTable from '@ors/components/manage/Blocks/Table/ReportsTable/ReportsTable'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import Link from '@ors/components/ui/Link'

export const metadata: Metadata = {
  title: 'Reports',
}

export default async function Reports() {
  return (
    <PageWrapper>
      <Box className="mb-4 w-full max-w-sm">
        <Typography className="mb-4" variant="h4">
          Create submission {new Date().getFullYear()}
        </Typography>
        <Typography className="mb-4">Create a submission</Typography>
        <Link href="/reports/create">
          <Button className="w-full" variant="contained">
            Create
          </Button>
        </Link>
      </Box>
      <ReportsTable />
    </PageWrapper>
  )
}
