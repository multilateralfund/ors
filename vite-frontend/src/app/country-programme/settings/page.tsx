import type { Metadata } from 'next'

import React from 'react'

import CPSettings from '@ors/components/manage/Blocks/CountryProgramme/CPSettings'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import { PageHeading } from '@ors/components/ui/Heading/Heading'

export const metadata: Metadata = {
  title: 'Settings',
}

export default async function CPSettingsWrapper() {
  return (
    <PageWrapper className="mx-auto max-w-screen-xl">
      <HeaderTitle>
        <div className="container mx-auto max-w-screen-xl">
          <PageHeading>Settings</PageHeading>
        </div>
      </HeaderTitle>
      <CPSettings />
    </PageWrapper>
  )
}
