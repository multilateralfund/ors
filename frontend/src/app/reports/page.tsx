import type { Metadata } from 'next'

import React from 'react'

import { Box, Button } from '@mui/material'
import Link from 'next/link'

import ReportsTable from '@ors/components/manage/Blocks/Table/ReportsTable'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

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
