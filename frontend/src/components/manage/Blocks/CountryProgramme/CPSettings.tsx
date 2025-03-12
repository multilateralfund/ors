'use client'
import * as React from 'react'
import { useState } from 'react'

import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Typography,
  TextField,
} from '@mui/material'
import { useSnackbar } from 'notistack'

import api from '@ors/helpers/Api/_api'
import { useStore } from '@ors/store'

const CPSettings: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar()
  const { setSettings, settings } = useStore((state) => state.common)

  const [sendEmail, setSendEmail] = useState(settings.data?.send_mail || false)
  const [notificationEmails, setNotificationEmails] = useState(
    settings.data?.cp_notification_emails || ''
  )

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

  const handleNotificationEmailsChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNotificationEmails(event.target.value)
  }

  const handleSaveEmails = async () => {
    try {
      const newSettings = {
        ...settings.data,
        cp_notification_emails: notificationEmails,
      }

      await api(`api/settings`, {
        data: newSettings,
        method: 'POST',
      })

      setNotificationEmails(newSettings.cp_notification_emails)
      setSettings({
        // @ts-ignore
        data: newSettings,
      })
      setError(false)
      enqueueSnackbar('Notification emails updated successfully', {
        variant: 'success',
      })
    } catch (error) {
      console.error('Error updating notification emails:', error)
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
      height="100"
      justifyContent="start"
    >
      <form style={{ width: '100%' }}>
        <FormControl
          className="flex w-full flex-col"
          component="fieldset"
          error={error}
          fullWidth
          variant="standard"
        >
          <FormLabel component="legend">Email:</FormLabel>
          <FormGroup>
            <FormControlLabel
              className="text-lg"
              labelPlacement="end"
              sx={{
                marginLeft: 0,
                '.MuiFormControlLabel-label': { flex: 1 }
              }}
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
                  Send email notifications to users:
                </Typography>
              }
            />
            <Box sx={{ display: 'flex', gap: 2, ml: 3, mt: 2 }}>
              <TextField
                label="Notified emails"
                variant="outlined"
                sx={{ width: '60%' }}
                value={notificationEmails}
                onChange={handleNotificationEmailsChange}
                helperText="Enter email addresses separated by commas"
              />
              <Button
                variant="contained"
                onClick={handleSaveEmails}
                sx={{ height: 'fit-content', alignSelf: 'start', mt: 1 }}
              >
                Save Emails
              </Button>
            </Box>
          </FormGroup>
          {error && (
            <FormHelperText>
              Something went wrong. Please try again.
            </FormHelperText>
          )}
        </FormControl>
      </form>
    </Box>
  )
}

export default CPSettings
