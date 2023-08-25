'use client'
import { useState } from 'react'

import {
  Box,
  Button,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'

import Field from '@ors/components/manage/Form/Field'

function Divider() {
  return <div className="my-8 h-[1px] w-full bg-gray-200 bg-opacity-30" />
}

export default function CreateSubmissionForm() {
  const [substanceType, setSubstanceType] = useState('hcfc')

  return (
    <Grid spacing={2} container>
      <Grid lg={8} xs={12} item>
        <Box>
          <Field InputLabel={{ label: 'Project title' }} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field InputLabel={{ label: 'Lead agency' }} />
            <Field InputLabel={{ label: 'Cooperating agencies' }} />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field InputLabel={{ label: 'Country' }} />
            <Field InputLabel={{ label: 'Sector' }} />
            <Field InputLabel={{ label: 'Subsector' }} />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field InputLabel={{ label: 'Type' }} />
          </div>
          <Divider />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field InputLabel={{ label: 'Substances targeted' }} />
          </div>
          <ToggleButtonGroup
            aria-label="Substance type"
            color="primary"
            value={substanceType}
            exclusive
            onChange={(event, value) => {
              setSubstanceType(value)
            }}
          >
            <ToggleButton value="hcfc">HCFC</ToggleButton>
            <ToggleButton value="hfc">HFC</ToggleButton>
          </ToggleButtonGroup>
          <Divider />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field InputLabel={{ label: 'Funds allocated' }} />
            <Field InputLabel={{ label: '13%' }} />
          </div>
          <Divider />
          <Field InputLabel={{ label: 'National agency' }} />
          <Field InputLabel={{ label: 'Description' }} type="textarea" />
          <Button variant="contained">Submit proposal</Button>
        </Box>
      </Grid>
      <Grid lg={4} xs={12} item>
        <Box className="lg:border-none lg:bg-transparent lg:shadow-none">
          <Typography className="mb-4 text-typography-secondary" variant="h5">
            Project submission instructions
          </Typography>
          <Typography className="mb-4 font-bold">
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industrys standard dummy text
            ever since the 1500s, when an unknown printer took a galley of type
            and scrambled it to make a type specimen book.
          </Typography>
          <Typography>
            It has survived not only five centuries, but also the leap into
            electronic typesetting, remaining essentially unchanged. It was
            popularised in the 1960s with the release of Letraset sheets
            containing Lorem Ipsum passages, and more recently with desktop
            publishing software like Aldus PageMaker including versions of Lorem
            Ipsum.
          </Typography>
          <Divider />
          <Typography className="mb-4 text-typography-secondary" variant="h5">
            History
          </Typography>
        </Box>
      </Grid>
    </Grid>
  )
}
