import type { Metadata } from 'next'

import React from 'react'

import CreateReportForm from '@ors/components/theme/Forms/CreateReportForm/CreateReportForm'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Create report',
}

export default async function CreateReport() {
  return (
    <PageWrapper>
      <CreateReportForm />
    </PageWrapper>
  )
}
