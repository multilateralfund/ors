import type { Metadata } from 'next'

import React from 'react'

import { Box, Button, Grid, Typography } from '@mui/material'

import CountryProgrammeTable from '@ors/components/manage/Blocks/Table/CountryProgrammeTable/CountryProgrammeTable'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import Link from '@ors/components/ui/Link/Link'

export const metadata: Metadata = {
  title: 'Country programme',
}

export default async function CountryProgramme() {
  return (
    <PageWrapper>
      <Grid spacing={2} container>
        <Grid lg={9} md={8} xs={12} item>
          <CountryProgrammeTable />
        </Grid>
        <Grid lg={3} md={4} xs={12} item>
          <Box className="mb-4 w-full md:max-w-sm">
            <Typography className="mb-4" variant="h4">
              Create submission {new Date().getFullYear()}
            </Typography>
            <Link href="/reports/create">
              <Button className="w-full" variant="contained">
                Create
              </Button>
            </Link>
          </Box>
        </Grid>
      </Grid>
    </PageWrapper>
  )
}
