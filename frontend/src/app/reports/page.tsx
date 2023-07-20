import Link from 'next/link'
import React from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import ReportsTable from '@ors/components/visualizations/ReportsTable'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reports',
}

export default async function Reports() {
  return (
    <PageWrapper className="mx-4 mt-4">
      <Box className="mb-4 w-full rounded p-8 md:w-fit ">
        <h4 className="mb-4 font-bold">
          Create submission {new Date().getFullYear()}
        </h4>
        <p className="mb-4 text-gray-700  dark:text-gray-400">
          Create a submission
        </p>
        <Link href="/reports/create">
          <Button variant="contained" className="w-full">
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
