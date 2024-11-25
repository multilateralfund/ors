import React from 'react'

import { Metadata } from 'next'

import PListing from '@ors/components/manage/Blocks/Projects/PListing'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Projects',
}

export default async function Projects() {
  return (
    <PageWrapper>
      <PListing />
    </PageWrapper>
  )
}
