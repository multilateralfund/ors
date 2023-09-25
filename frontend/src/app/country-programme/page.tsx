import type { Metadata } from 'next'

import React from 'react'

import { Box, Button, Grid, Typography } from '@mui/material'

import CPListing from '@ors/components/manage/Blocks/CountryProgramme/CPListing'
import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import Link from '@ors/components/ui/Link/Link'

export const metadata: Metadata = {
  title: 'Country programme',
}

export default async function CountryProgramme() {
  return (
    <PageWrapper>
      <HeaderTitle>
        <Typography className="text-white" component="h1" variant="h3">
          Submission List
        </Typography>
      </HeaderTitle>
      <Grid className="flex-col-reverse md:flex-row" spacing={2} container>
        <Grid lg={9} md={8} xs={12} item>
          <CPListing />
        </Grid>
        <Grid lg={3} md={4} xs={12} item>
          <Box>
            <Typography className="mb-4 text-typography-secondary" variant="h4">
              New submission
            </Typography>
            <Typography className="mb-4">
              Create a new country report for the current year.
            </Typography>
            <Link href="/country-programme/create">
              <Button variant="contained">Create submission</Button>
            </Link>
          </Box>
        </Grid>
      </Grid>
    </PageWrapper>
  )
}
