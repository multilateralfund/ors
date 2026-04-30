import React, {
  ChangeEventHandler,
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react'
import * as mui from '@mui/material'
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  TextField,
} from '@mui/material'

import api from '@ors/helpers/Api/_api'
import { formatApiUrl } from '@ors/helpers'

import { useSnackbar } from 'notistack'
import { useGetProjectSettings } from '@ors/components/manage/Blocks/ProjectsListing/hooks/useGetProjectSettings.ts'
import {
  ApiProjectSettings,
  ApiProjectSettingsForFrontend,
} from '@ors/types/api_project_settings.ts'
import { FormattedNumberInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { MdOutlineHistory } from 'react-icons/md'

type EmailSettingsType = {
  withNotifications: boolean
  emailAddresses: string
  errors: string | null
}
type SetEmailSettingsType = Dispatch<SetStateAction<EmailSettingsType>>

type ProjectSettingsParams = {
  data: ApiProjectSettingsForFrontend
  refetch: ReturnType<typeof useGetProjectSettings>['refetch']
}

type ProjectFieldSettings = Pick<
  ApiProjectSettings,
  ApiProjectSettingsForFrontend['sections']['Projects'][number]
>

const ProjectsSettingsEmails = (props: ProjectSettingsParams) => {
  const refetch = props.refetch
  const data = props.data.data
  const { enqueueSnackbar } = useSnackbar()

  const {
    project_submission_notifications_enabled,
    project_submission_notifications_emails,
    project_recommendation_notifications_enabled,
    project_recommendation_notifications_emails,
    apr_agency_submission_notifications_enabled,
    apr_agency_submission_notifications_emails,
  } = data

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
  const [aprAgencySubmitEmail, setAprAgencySubmitEmail] =
    useState<EmailSettingsType>({
      withNotifications: apr_agency_submission_notifications_enabled || false,
      emailAddresses: apr_agency_submission_notifications_emails || '',
      errors: null,
    })

  const emailOptions = useMemo(
    () => [
      {
        type: 'submission',
        emailSettings: submissionEmail,
        setEmailSettings: setSubmissionEmail,
        label: 'Emails for project submission:',
        checkboxLabel:
          'Send email notifications for project submission to users:',
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
        label: 'Emails for project recommendation:',
        checkboxLabel:
          'Send email notifications for project recommendation to users:',
        fieldsForUpdate: {
          send_email: 'project_recommendation_notifications_enabled',
          notification_emails: 'project_recommendation_notifications_emails',
        },
      },
      {
        type: 'APR',
        emailSettings: aprAgencySubmitEmail,
        setEmailSettings: setAprAgencySubmitEmail,
        label: 'Emails for APR agency submission:',
        checkboxLabel:
          'Send email notifications for APR agency submission to users:',
        fieldsForUpdate: {
          send_email: 'apr_agency_submission_notifications_enabled',
          notification_emails: 'apr_agency_submission_notifications_emails',
        },
      },
    ],
    [submissionEmail, recommendationEmail, areSameEmails, aprAgencySubmitEmail],
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
        ...data,
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
        withNotifications: newSettings[
          field as keyof ApiProjectSettings
        ] as boolean,
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

      refetch()

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
        ...data,
        [field]: emailAddresses,
      }

      await api(`api/project-settings`, {
        data: newSettings,
        method: 'POST',
      })

      setEmailSettings((prev) => ({
        ...prev,
        emailAddresses: newSettings[
          field as keyof ApiProjectSettings
        ] as string,
        errors: null,
      }))
      refetch()

      if (type === 'submission' && areSameEmails) {
        setRecommendationEmail((prev) => ({
          ...prev,
          emailAddresses: newSettings[
            field as keyof ApiProjectSettings
          ] as string,
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
    ({
      type,
      emailSettings,
      setEmailSettings,
      disabled,
      fieldsForUpdate,
      label,
      checkboxLabel,
    }) => {
      const hasUnsavedChanges =
        (type === 'submission' &&
          submissionEmail.emailAddresses !==
            project_submission_notifications_emails) ||
        (type === 'recommendation' &&
          recommendationEmail.emailAddresses !==
            project_recommendation_notifications_emails) ||
        (type === 'APR' &&
          aprAgencySubmitEmail.emailAddresses !==
            apr_agency_submission_notifications_emails)
      return (
        <mui.Box key={type}>
          <form>
            <FormControl className="w-full" error={!!emailSettings.errors}>
              <FormLabel className="text-[#0095D5]">{label}</FormLabel>
              <FormGroup className="w-fit">
                <FormControlLabel
                  className="text-lg"
                  label={checkboxLabel}
                  disabled={disabled}
                  control={
                    <Checkbox
                      name={`send_${type}_email`}
                      checked={emailSettings.withNotifications}
                      onChange={(event) => {
                        handleWithNotificationsChange(
                          event.target.checked,
                          setEmailSettings,
                          fieldsForUpdate.send_email,
                          type,
                        )
                      }}
                      inputProps={{ 'aria-label': 'controlled', tabIndex: 0 }}
                      sx={{
                        '&.Mui-focusVisible': {
                          backgroundColor: 'rgba(0, 0, 0, 0.03)',
                        },
                        color: 'black',
                      }}
                    />
                  }
                  componentsProps={{
                    typography: { fontSize: '1rem', marginTop: '2px' },
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
                      inputProps={{ tabIndex: 0 }}
                      sx={{
                        '&.Mui-focusVisible': {
                          backgroundColor: 'rgba(0, 0, 0, 0.03)',
                        },
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
        </mui.Box>
      )
    },
  )
}

const submitData = async <DT,>(
  data: DT,
  msgSuccess: string,
  enqueueSnackbar: ReturnType<typeof useSnackbar>['enqueueSnackbar'],
) => {
  try {
    await api(`api/project-settings`, {
      data: data,
      method: 'POST',
    })

    enqueueSnackbar(msgSuccess, {
      variant: 'success',
    })
  } catch (error) {
    console.error('Error updating data:', error)

    const errors = await error.json()
    if (errors.detail) {
      enqueueSnackbar('Something went wrong. Please try again.', {
        variant: 'error',
      })
    }
  }
}

const ProjectsSettingsGlobalFields = ({
  data,
  refetch,
}: ProjectSettingsParams) => {
  const { enqueueSnackbar } = useSnackbar()

  const fields = data.sections.Projects

  const [form, setForm] = useState<ProjectFieldSettings>(() => {
    const entries = Object.entries(data.data).filter(([k]) =>
      (fields as readonly string[]).includes(k),
    ) as [keyof ProjectFieldSettings, string][]

    return Object.fromEntries(entries) as ProjectFieldSettings
  })

  const handleInput: ChangeEventHandler<HTMLInputElement> = useCallback(
    (evt) => {
      setForm((prev) => ({ ...prev, [evt.target.name]: evt.target.value }))
    },
    [setForm],
  )
  const resetValue = useCallback(
    (name: keyof typeof data.data) => {
      setForm((prev) => ({ ...prev, [name]: data.data[name] }))
    },
    [data],
  )
  const handleSubmit = async () => {
    await submitData<ProjectFieldSettings>(
      form,
      'Fields updated successfully.',
      enqueueSnackbar,
    )
    refetch()
  }
  return (
    <mui.Box>
      {fields.map((f) => {
        return (
          <div className="my-2 flex items-center">
            <label className="inline-block w-96" htmlFor={f}>
              {data.fields[f].title}
            </label>
            <FormattedNumberInput
              id={f}
              value={form[f]}
              onChange={handleInput}
              className={'w-72'}
            />
            {data.data[f] !== form[f] ? (
              <mui.Tooltip placement="top" title="Revert value.">
                <div
                  className="flex cursor-pointer items-center gap-2 text-xl normal-case leading-none"
                  onClick={() => resetValue(f)}
                >
                  <MdOutlineHistory />
                </div>
              </mui.Tooltip>
            ) : null}
          </div>
        )
      })}
      <mui.Button onClick={handleSubmit} variant="contained">
        Save changes
      </mui.Button>
    </mui.Box>
  )
}

const ProjectsSettingsListsOfTerms = () => {
  const firstColumnClassName = 'py-2 pr-6'
  const secondColumnClassName = 'px-6 py-2'

  return (
    <mui.Box>
      <h2 className="mt-2 text-3xl">
        Management of values for the pick lists used in the IA/BA portal
      </h2>

      <h2 className="mt-6">Project specific fields</h2>

      <p>
        Defines impact fields for a given cluster/type/sector combination. Both
        the planned and actual indicator need to be added.
      </p>
      <p>
        <strong>Warning:</strong> do not add any other fields than the specific
        ones, because the cross cutting and identifier ones are defined for
        consistency and implementation purposes. It is best to import the
        combinations from the respective file.
      </p>

      <p>
        These fields can be added from{' '}
        <a
          className="italic text-inherit"
          target="_blank"
          rel="noopener noreferrer nofollow"
          href={formatApiUrl('/admin/core/projectspecificfields/')}
        >
          /admin/core/projectspecificfields/
        </a>
      </p>

      <h2 className="mt-8">Substances</h2>

      <tr>
        <th className={firstColumnClassName}>Label in application</th>
        <th className={secondColumnClassName}>Values</th>
      </tr>

      <tr>
        <td className={firstColumnClassName}>Substances</td>
        <td className={secondColumnClassName}>
          <a
            className="italic text-inherit"
            target="_blank"
            rel="noopener noreferrer nofollow"
            href={formatApiUrl('/admin/core/substance/')}
          >
            /admin/core/substance/
          </a>
        </td>
      </tr>

      <tr>
        <td className={firstColumnClassName}>Substance alternative names</td>
        <td className={secondColumnClassName}>
          <a
            className="italic text-inherit"
            target="_blank"
            rel="noopener noreferrer nofollow"
            href={formatApiUrl('/admin/core/substancealtname/')}
          >
            /admin/core/substancealtname/
          </a>
        </td>
      </tr>

      <h2 className="mt-8">
        Fields that cannot be changed in the Master Database
      </h2>

      <p>
        The following fields are defined in the database, but they can only be
        changed by programmers, because of their impact in the application's
        logic:
      </p>
      <ul>
        <li>Project statuses</li>
        <li>Project submission statuses</li>
      </ul>

      <p>
        The following fields do not have the values stored in the Master
        Database; the values are defined in the source code:
      </p>

      <tr>
        <th className={firstColumnClassName}>Label in application</th>
        <th className={secondColumnClassName}>Values</th>
      </tr>
      <tr>
        <td className={firstColumnClassName}>
          Blanket approval or individual consideration
        </td>
        <td className={secondColumnClassName}>
          Blanket
          <br />
          Individual
        </td>
      </tr>
      <tr>
        <td className={firstColumnClassName}>Consumption level status</td>
        <td className={secondColumnClassName}>
          LVC
          <br />
          Non-LVC
          <br />
          N/A
        </td>
      </tr>
      <tr>
        <td className={firstColumnClassName}>Production control type</td>
        <td className={secondColumnClassName}>
          Reduction
          <br />
          Closure
          <br />
          Switch to production for feedstock uses
          <br />
          Conversion to non-controlled substance
          <br />
          Other
        </td>
      </tr>
      <tr>
        <td className={firstColumnClassName}>Category</td>
        <td className={secondColumnClassName}>
          Multi-year agreement
          <br />
          Individual
        </td>
      </tr>
      <tr>
        <td className={firstColumnClassName}>Attachments → Type</td>
        <td className={secondColumnClassName}>
          Project proposal
          <br />
          Endorsement/transmittal letter from government
          <br />
          Verification report
          <br />
          Project review comments
          <br />
          Transferred project proposal
          <br />
          Other
        </td>
      </tr>
    </mui.Box>
  )
}

enum Tab {
  Emails = 0,
  GlobalFields = 1,
  ListsOfTerms = 2,
}

const ProjectsSettings = ({ data, refetch }: ProjectSettingsParams) => {
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.Emails)
  const tabContent = useMemo(() => {
    switch (currentTab) {
      case Tab.Emails:
        return <ProjectsSettingsEmails data={data} refetch={refetch} />
      case Tab.GlobalFields:
        return <ProjectsSettingsGlobalFields data={data} refetch={refetch} />
      case Tab.ListsOfTerms:
        return <ProjectsSettingsListsOfTerms />
    }
  }, [currentTab, data, refetch])
  return (
    <div>
      <mui.Tabs
        aria-label="settings-tabs"
        value={currentTab}
        className="sectionsTabs mt-6"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        TabIndicatorProps={{
          className: 'h-0',
          style: { transitionDuration: '150ms' },
        }}
        onChange={(_, v) => setCurrentTab(v)}
      >
        <mui.Tab label="Emails" />
        <mui.Tab label="Global fields" />
        <mui.Tab label="Lists of terms" />
      </mui.Tabs>
      {tabContent}
    </div>
  )
}

const ProjectSettingsWrapper = () => {
  const { data, refetch } = useGetProjectSettings(true)

  return data ? <ProjectsSettings data={data} refetch={refetch} /> : null
}
export default ProjectSettingsWrapper
