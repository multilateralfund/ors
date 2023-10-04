import type { Metadata } from 'next'

import React from 'react'

import CPReportCreate from '@ors/components/manage/Blocks/CountryProgramme/CPReportCreate'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import api from '@ors/helpers/Api/Api'

export const metadata: Metadata = {
  title: 'Create report',
}

export default async function CreateReport() {
  const emptyForm = await api('api/country-programme/empty-form/', {}, false)

  return (
    <PageWrapper>
      <CPReportCreate emptyForm={emptyForm} />
    </PageWrapper>
  )
}
