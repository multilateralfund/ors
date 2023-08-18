import type { Metadata } from 'next'

import React from 'react'

import CreateSubmissionForm from '@ors/components/theme/Forms/CreateSubmissionForm/CreateSubmissionForm'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export const metadata: Metadata = {
  title: 'Create report',
}

export default async function CreateReport() {
  return (
    <PageWrapper>
      <CreateSubmissionForm />
    </PageWrapper>
  )
}
