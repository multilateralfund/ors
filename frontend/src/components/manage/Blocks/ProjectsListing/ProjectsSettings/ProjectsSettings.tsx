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
  const { setProjectSettings, project_settings } = useStore(
    (state) => state.projects,
  )
  const {
    project_submission_notifications_enabled,
    project_submission_notifications_emails,
    project_recommendation_notifications_enabled,
    project_recommendation_notifications_emails,
  } = project_settings.data

  const [submissionEmail, setSubmissionEmail] = useState<EmailSettingsType>({
    withNotifications: project_submission_notifications_enabled || false,
    emailAddresses: project_submission_notifications_emails || '',
    errors: null,
  })
  const [recommendationEmail, setRecommendationEmail] =
    useState<EmailSettingsType>({
      withNotifications: project_recommendation_notifications_enabled || false,
      emailAddresses: project_recommendation_notifications_emails || '',
      errors: null,
    })
  const [areSameEmails, setAreSameEmails] = useState(
    submissionEmail.withNotifications ===
      recommendationEmail.withNotifications &&
      submissionEmail.emailAddresses === recommendationEmail.emailAddresses,
  )

  const emailOptions = useMemo(
    () => [
      {
        type: 'submission',
        emailSettings: submissionEmail,
        setEmailSettings: setSubmissionEmail,
        fieldsForUpdate: {
          send_email: 'project_submission_notifications_enabled',
          notification_emails: 'project_submission_notifications_emails',
        },
      },
      {
        type: 'recommendation',
        emailSettings: recommendationEmail,
        setEmailSettings: setRecommendationEmail,
        disabled: areSameEmails,
        fieldsForUpdate: {
          send_email: 'project_recommendation_notifications_enabled',
          notification_emails: 'project_recommendation_notifications_emails',
        },
      },
    ],
    [submissionEmail, recommendationEmail, areSameEmails],
  )

  const handleSameEmailsAsAbove = async () => {
    setAreSameEmails((prev) => !prev)

    if (!areSameEmails) {
      setRecommendationEmail((prev) => ({
        ...prev,
        emailAddresses: project_submission_notifications_emails || '',
      }))

      await handleWithNotificationsChange(
        project_submission_notifications_enabled || false,
        setRecommendationEmail,
        'project_recommendation_notifications_enabled',
        'recommendation',
      )
    }
  }

  const handleWithNotificationsChange = async (
    withNotifications: boolean,
    setEmailSettings: SetEmailSettingsType,
    field: string,
    type: string,
  ) => {
    const isSameAsAbove = type === 'submission' && areSameEmails

    try {
      const newSettings = {
        ...project_settings.data,
        [field]: withNotifications,
        ...(isSameAsAbove
          ? { project_recommendation_notifications_enabled: withNotifications }
          : {}),
      }

      await api(`api/project-settings`, {
        data: newSettings,
        method: 'POST',
      })

      setEmailSettings((prev) => ({
        ...prev,
        withNotifications: newSettings[field as keyof Settings] as boolean,
        errors: null,
      }))

      if (isSameAsAbove) {
        setRecommendationEmail((prev) => ({
          ...prev,
          withNotifications: newSettings[
            'project_recommendation_notifications_enabled'
          ] as boolean,
          errors: null,
        }))
      }

      setProjectSettings({
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
    type: string,
  ) => {
    try {
      const newSettings = {
        ...project_settings.data,
        [field]: emailAddresses,
      }

      await api(`api/project-settings`, {
        data: newSettings,
        method: 'POST',
      })

      setEmailSettings((prev) => ({
        ...prev,
        emailAddresses: newSettings[field as keyof Settings] as string,
        errors: null,
      }))
      setProjectSettings({
        // @ts-ignore
        data: newSettings,
      })

      if (type === 'submission' && areSameEmails) {
        setRecommendationEmail((prev) => ({
          ...prev,
          emailAddresses: newSettings[field as keyof Settings] as string,
        }))
      }

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
    ({ type, emailSettings, setEmailSettings, disabled, fieldsForUpdate }) => {
      const hasUnsavedChanges =
        (type === 'submission' &&
          submissionEmail.emailAddresses !==
            project_submission_notifications_emails) ||
        (type === 'recommendation' &&
          recommendationEmail.emailAddresses !==
            project_recommendation_notifications_emails)
      return (
        <Box key={type} className="mt-5">
          <form>
            <FormControl className="w-full" error={!!emailSettings.errors}>
              <FormLabel className="text-[#0095D5]">
                Emails for project {type}:
              </FormLabel>
              <FormGroup className="w-fit">
                <FormControlLabel
                  className="text-lg"
                  label={`Send email notifications for project ${type} to users:`}
                  disabled={disabled}
                  control={
                    <Checkbox
                      name={`send_${type}_email`}
                      checked={emailSettings.withNotifications}
                      onChange={(
                        event: React.ChangeEvent<HTMLInputElement>,
                      ) => {
                        handleWithNotificationsChange(
                          event.target.checked,
                          setEmailSettings,
                          fieldsForUpdate.send_email,
                          type,
                        )
                      }}
                      inputProps={{ 'aria-label': 'controlled' }}
                    />
                  }
                  componentsProps={{
                    typography: { fontSize: '1.05rem', marginTop: '2px' },
                  }}
                />
              </FormGroup>
              <div className="mt-4 flex flex-wrap gap-2">
                <TextField
                  className="min-w-60 flex-1"
                  label="Notified emails"
                  variant="outlined"
                  value={emailSettings.emailAddresses}
                  disabled={disabled}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    handleEmailAddressesChange(event, setEmailSettings)
                  }}
                  helperText="Enter email addresses separated by commas"
                />
                <Button
                  variant="contained"
                  className="relative mt-2.5 h-fit self-start"
                  onClick={() => {
                    handleSaveEmailAddresses(
                      emailSettings.emailAddresses,
                      setEmailSettings,
                      fieldsForUpdate.notification_emails,
                      type,
                    )
                  }}
                >
                  Save Emails
                  {hasUnsavedChanges && (
                    <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-warning" />
                  )}
                </Button>
              </div>
              {type === 'recommendation' && (
                <FormControlLabel
                  className="w-fit"
                  label="Same as above"
                  control={
                    <Checkbox
                      checked={areSameEmails}
                      onChange={handleSameEmailsAsAbove}
                      size="small"
                      sx={{
                        color: 'black',
                      }}
                    />
                  }
                  componentsProps={{
                    typography: { fontSize: '1rem' },
                  }}
                />
              )}
              {!!emailSettings.errors && (
                <FormHelperText className="text-lg text-red-500">
                  {emailSettings.errors}
                </FormHelperText>
              )}
            </FormControl>
          </form>
        </Box>
      )
    },
  )
}

export default ProjectsSettings
