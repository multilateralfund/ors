import React from 'react'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper.tsx'
import BackLink from '@ors/components/manage/Blocks/ProjectReport/BackLink.tsx'
import Loader from '@ors/components/manage/Blocks/ProjectReport/Loader.tsx'
import { Box } from '@mui/material'
import { PageHeading } from '@ors/components/ui/Heading/Heading.tsx'

function PCRView() {
  return (
    <PageWrapper>
      <BackLink url="~/projects-listing" text="IA/BA Portal" />
      <PageHeading>
        Project Completion Reports
      </PageHeading>
      <Box className="shadow-none">
        <Loader active={false} />
      </Box>
    </PageWrapper>
  )
}

export default PCRView
