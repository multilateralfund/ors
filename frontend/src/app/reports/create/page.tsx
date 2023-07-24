import type { Metadata } from 'next'

import React from 'react'

import { Box, Button, Typography } from '@mui/material'
import Link from 'next/link'

import { PageWrapper, Portal } from '@ors/components'

export const metadata: Metadata = {
  title: 'Create report',
}

export default async function CreateReport() {
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
      <Portal domNode="bottom-control">
        <Box className="w-full justify-between border-0 border-t px-4">
          <Button color="error" size="small" variant="contained">
            Close
          </Button>
        </Box>
      </Portal>
    </PageWrapper>
  )
}
