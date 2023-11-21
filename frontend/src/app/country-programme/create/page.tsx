import type { Metadata } from 'next'

import React from 'react'

import CPReportCreate from '@ors/components/manage/Blocks/CountryProgramme/CPReportCreate'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Create report',
}

export default async function CreateReport() {
  return (
    <PageWrapper>
      <CPReportCreate />
    </PageWrapper>
  )
}
