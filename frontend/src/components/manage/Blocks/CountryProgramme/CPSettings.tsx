'use client'
import * as React from 'react'
import { useState } from 'react'

import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'

import api from '@ors/helpers/Api/_api'
import { useStore } from '@ors/store'

const CPSettings: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar()
  const { setSettings, settings } = useStore((state) => state.common)

  const [sendEmail, setSendEmail] = useState(settings.data?.send_mail || false)

  const [error, setError] = useState(false) // State to track input error

  const handleEmailSettingsChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      const newSettings = {
        ...settings.data,
        send_mail: event.target.checked,
      }

      await api(`api/settings`, {
        data: newSettings,
        method: 'POST',
      })

      setSendEmail(newSettings.send_mail)
      setSettings({
        // @ts-ignore
        data: newSettings,
      })
      setError(false)
      enqueueSnackbar('Email settings updated successfully', {
        variant: 'success',
      })
    } catch (error) {
      // Handle fetch error
      console.error('Error updating email settings:', error)
      setError(true)
      const errors = await error.json()
      errors.detail &&
        enqueueSnackbar(errors.detail, {
          variant: 'error',
        })
    }
  }

  return (
    <Box
      alignItems="center"
      display="flex"
      height="100" // Adjust this value as needed
      justifyContent="start"
    >
      <form>
        <FormControl
          className="flex w-full flex-col"
          component="fieldset"
          error={error}
          fullWidth={false}
          variant="standard"
        >
          <FormLabel component="legend">Email:</FormLabel>
          <FormGroup row>
            <FormControlLabel
              className="text-lg"
              labelPlacement="start"
              control={
                <Checkbox
                  name="send_mail"
                  className="hover:bg-primary hover:text-mlfs-hlYellow"
                  checked={sendEmail}
                  inputProps={{ 'aria-label': 'controlled' }}
                  onChange={handleEmailSettingsChange}
                />
              }
              label={
                <Typography className="text-lg">
                  Send email notifications to users
                </Typography>
              }
            />
          </FormGroup>
          {error && (
            <FormHelperText>
              Something went wrong. Please try again
            </FormHelperText>
          )}
        </FormControl>
      </form>
    </Box>
  )
}

export default CPSettings
