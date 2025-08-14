'use client'

import { Dispatch, SetStateAction, useMemo, useState } from 'react'

import api from '@ors/helpers/Api/_api'
import { useStore } from '@ors/store'
import { Settings } from '@ors/types/store'

import { useSnackbar } from 'notistack'
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

type EmailSettingsType = {
  withNotifications: boolean
  emailAddresses: string
  errors: string | null
}
type SetEmailSettingsType = Dispatch<SetStateAction<EmailSettingsType>>

const ProjectsSettings = () => {
  const { enqueueSnackbar } = useSnackbar()
  const { settings, setSettings } = useStore((state) => state.common)

  const [submissionEmail, setSubmissionEmail] = useState<EmailSettingsType>({
    withNotifications: settings.data?.send_submission_email || false,
    emailAddresses: settings.data?.project_submission_notification_emails || '',
    errors: null,
  })
  const [recommendationEmail, setRecommendationEmail] =
    useState<EmailSettingsType>({
      withNotifications: settings.data?.send_recommendation_email || false,
      emailAddresses:
        settings.data?.project_recommendation_notification_emails || '',
      errors: null,
    })

  const emailOptions = useMemo(
    () => [
      {
        type: 'submission',
        emailSettings: submissionEmail,
        setEmailSettings: setSubmissionEmail,
        fieldsForUpdate: {
          send_email: 'send_submission_email',
          notification_emails: 'project_submission_notification_emails',
        },
      },
      {
        type: 'recommendation',
        emailSettings: recommendationEmail,
        setEmailSettings: setRecommendationEmail,
        fieldsForUpdate: {
          send_email: 'send_recommendation_email',
          notification_emails: 'project_recommendation_notification_emails',
        },
      },
    ],
    [submissionEmail, recommendationEmail],
  )

  const handleWithNotificationsChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    setEmailSettings: SetEmailSettingsType,
    field: string,
  ) => {
    try {
      const newSettings = {
        ...settings.data,
        [field]: event.target.checked,
      }

      await api(`api/settings`, {
        data: newSettings,
        method: 'POST',
      })

      setEmailSettings((prev) => ({
        ...prev,
        withNotifications: newSettings[field as keyof Settings] as boolean,
        errors: null,
      }))
      setSettings({
        // @ts-ignore
        data: newSettings,
      })

      enqueueSnackbar('Email settings updated successfully', {
        variant: 'success',
      })
    } catch (error) {
      console.error('Error updating email settings:', error)

      const errors = await error.json()
      if (errors.detail) {
        setEmailSettings((prev) => ({ ...prev, errors: errors.detail }))
        enqueueSnackbar('Something went wrong. Please try again.', {
          variant: 'error',
        })
      }
    }
  }

  const handleEmailAddressesChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setEmailSettings: SetEmailSettingsType,
  ) => {
    setEmailSettings((prev) => ({
      ...prev,
      emailAddresses: event.target.value,
    }))
  }

  const handleSaveEmailAddresses = async (
    emailAddresses: string,
    setEmailSettings: SetEmailSettingsType,
    field: string,
  ) => {
    try {
      const newSettings = {
        ...settings.data,
        [field]: emailAddresses,
      }

      await api(`api/settings`, {
        data: newSettings,
        method: 'POST',
      })

      setEmailSettings((prev) => ({
        ...prev,
        emailAddresses: newSettings[field as keyof Settings] as string,
        errors: null,
      }))
      setSettings({
        // @ts-ignore
        data: newSettings,
      })

      enqueueSnackbar('Notification emails updated successfully', {
        variant: 'success',
      })
    } catch (error) {
      console.error('Error updating notification emails:', error)

      const errors = await error.json()
      if (errors.detail) {
        setEmailSettings((prev) => ({ ...prev, errors: errors.detail }))
        enqueueSnackbar('Something went wrong. Please try again.', {
          variant: 'error',
        })
      }
    }
  }

  return emailOptions.map(
    ({ type, emailSettings, setEmailSettings, fieldsForUpdate }) => (
      <Box className="mt-5">
        <form>
          <FormControl className="w-full" error={!!emailSettings.errors}>
            <FormLabel className="text-[#0095D5]">
              Emails for project {type}:
            </FormLabel>
            <FormGroup className="w-fit">
              <FormControlLabel
                className="text-lg"
                control={
                  <Checkbox
                    name={`send_${type}_email`}
                    checked={emailSettings.withNotifications}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      handleWithNotificationsChange(
                        event,
                        setEmailSettings,
                        fieldsForUpdate.send_email,
                      )
                    }}
                    inputProps={{ 'aria-label': 'controlled' }}
                  />
                }
                label={
                  <Typography className="mt-0.5 text-lg">
                    Send email notifications for project {type} to users:
                  </Typography>
                }
              />
            </FormGroup>
            <div className="mt-4 flex flex-wrap gap-2">
              <TextField
                className="min-w-48 flex-1"
                label="Notified emails"
                variant="outlined"
                value={emailSettings.emailAddresses}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  handleEmailAddressesChange(event, setEmailSettings)
                }}
                helperText="Enter email addresses separated by commas"
              />
              <Button
                variant="contained"
                className="mt-2.5 h-fit self-start"
                onClick={() => {
                  handleSaveEmailAddresses(
                    emailSettings.emailAddresses,
                    setEmailSettings,
                    fieldsForUpdate.notification_emails,
                  )
                }}
              >
                Save Emails
              </Button>
            </div>
            {!!emailSettings.errors && (
              <FormHelperText className="text-lg text-red-500">
                {emailSettings.errors}
              </FormHelperText>
            )}
          </FormControl>
        </form>
      </Box>
    ),
  )
}

export default ProjectsSettings
