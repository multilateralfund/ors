import React from 'react'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper.tsx'
import BackToWorkspace from '@ors/components/manage/Blocks/AnnualProgressReport/BackToWorkspace.tsx'
import { useParams } from 'wouter'
import { PageHeading } from '@ors/components/ui/Heading/Heading.tsx'
import { Box } from '@mui/material'

export default function APREdit() {
  const { year } = useParams()

  return (
    <PageWrapper>
      <BackToWorkspace year={year} />
      <PageHeading className="min-w-fit">
        <span className="font-normal">Update: </span>
        {`Annual Progress Report (${year})`}
      </PageHeading>
      <Box className="shadow-none">

      </Box>
    </PageWrapper>
  )
}
