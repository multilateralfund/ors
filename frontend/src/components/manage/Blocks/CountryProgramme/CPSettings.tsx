'use client'
import * as React from 'react'

import { Typography } from '@mui/material'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'

import { useStore } from '@ors/store'

const CPSettings: React.FC = () => {
  const settings = useStore((state) => state.common.settings.data)
  console.log(settings)
  return (
    <Box
      alignItems="center"
      display="flex"
      height="100" // Adjust this value as needed
      justifyContent="start"
    >
      <form>
        <FormControl
          className="flex w-full flex-row"
          component="fieldset"
          fullWidth={false}
          variant="standard"
        >
          <legend className="mb-3 inline-block text-2xl font-normal">
            Email:
          </legend>
          <FormGroup row>
            <FormControlLabel
              className="text-lg"
              labelPlacement="start"
              control={
                <Checkbox className="hover:bg-primary hover:text-mlfs-hlYellow" />
              }
              label={
                <Typography className="text-lg">
                  Send email notifications to users
                </Typography>
              }
            />
          </FormGroup>
        </FormControl>
      </form>
    </Box>
  )
}

export default CPSettings
