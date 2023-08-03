import React from 'react'

import { Metadata } from 'next'

import ProjectsTable from '@ors/components/manage/Blocks/Table/ProjectsTable/ProjectsTable'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Projects',
}

export default async function Reports() {
  return (
    <PageWrapper>
      <ProjectsTable />
    </PageWrapper>
  )
}
