import React from 'react'

import { Typography } from '@mui/material'
import { Metadata } from 'next'

import SubmissionsTable from '@ors/components/manage/Blocks/Table/SubmissionsTable/SubmissionsTable'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import Link from '@ors/components/ui/Link'

export const metadata: Metadata = {
  title: 'Projects',
}

export default async function Reports() {
  return (
    <PageWrapper>
      <Typography className="mb-4">
        <Link href="/submissions/create" button>
          Add new submission
        </Link>
      </Typography>
      <SubmissionsTable />
    </PageWrapper>
  )
}
