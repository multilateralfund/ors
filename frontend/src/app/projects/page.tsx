import React from 'react'

import { Box } from '@mui/material'
import { Metadata } from 'next'

import ProjectsTable from '@ors/components/manage/Blocks/Table/ProjectsTable'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Projects',
}

export default async function Reports() {
  return (
    <PageWrapper>
      <Box className="mb-4 w-full max-w-sm rounded">Projects</Box>
      <ProjectsTable />
    </PageWrapper>
  )
}
