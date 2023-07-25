import type { Metadata } from 'next'

import React from 'react'

import { Box, Button, Typography } from '@mui/material'

import { Link, PageWrapper, ReportsTable } from '@ors/components'

export const metadata: Metadata = {
  title: 'Reports',
}

export default async function Reports() {
  return (
    <PageWrapper>
      <Box className="mb-4 w-full max-w-sm rounded">
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
      <Box className="rounded p-0">
        <ReportsTable />
      </Box>
    </PageWrapper>
  )
}
