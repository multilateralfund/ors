import React from 'react'

import { Metadata } from 'next'

import ProjectsListing from '@ors/components/manage/Blocks/Listing/ProjectsListing/ProjectsListing'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Projects',
}

export default async function Projects() {
  return (
    <PageWrapper>
      <ProjectsListing />
    </PageWrapper>
  )
}
