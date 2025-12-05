import React, { Dispatch, FormEvent, SetStateAction, useState } from 'react'
import { Alert, Box, Modal, TextField, Typography } from '@mui/material'
import Button from '@mui/material/Button'
import { CancelButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents.tsx'
import { FieldPopoverInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { useStore } from '@ors/store.tsx'
import { reverse } from 'lodash'
import { enqueueSnackbar } from 'notistack'
import { IoInformationCircleOutline } from 'react-icons/io5'
import { api } from '@ors/helpers'
import cx from 'classnames'
import { AnnualProgressReport } from '@ors/app/annual-project-report/types.ts'
import { useConfirmation } from '@ors/contexts/AnnualProjectReport/APRContext.tsx'
import dayjs from 'dayjs'

const REMARKS_LIMIT = 400

interface EndorseAPRModalProps {
  isModalOpen: boolean
  setIsModalOpen: Dispatch<SetStateAction<boolean>>
  disabled: boolean
  revalidateData: () => void
  year: string | undefined
  currentData?: AnnualProgressReport | null
}

export default function EndorseAprModal({
  isModalOpen,
  setIsModalOpen,
  disabled,
  revalidateData,
  year,
  currentData,
}: EndorseAPRModalProps) {
  const confirm = useConfirmation()
  const [errors, setErrors] = useState<string[]>([])
  const projectSlice = useStore((state) => state.projects)
  const meetings = projectSlice.meetings.data
  const formattedMeetings = meetings?.map((meeting: any) => ({
    label: meeting.number,
    value: meeting.id.toString(),
  }))
  const meetingOptions = reverse(formattedMeetings)

  const formSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrors([])

    // Capture form, as event.currentTarget becomes null after the event finishes bubbling
    const form = event.currentTarget
    const formData = new FormData(form)

    const response = await confirm({
      title: 'Endorse APR',
      message: 'Are you sure you want to endorse the APR?',
    })

    if (!response) {
      return
    }

    const errors: string[] = []

    const meeting = formData.get('meeting_endorsed')
    const date = formData.get('date_endorsed')
    const remarks = formData.get('remarks_endorsed')

    if (!meeting) {
      errors.push('Selecting a meeting is required.')
    }
    if (!date) {
      errors.push('Selecting an endorsement date is required.')
    }
    if (typeof remarks === 'string' && remarks.length > REMARKS_LIMIT) {
      errors.push(`Remarks are limited to ${REMARKS_LIMIT} characters.`)
    }

    if (errors.length > 0) {
      setErrors(errors)
      return
    }

    try {
      await api(`api/annual-project-report/${year}/endorse/`, {
        method: 'POST',
        data: {
          remarks_endorsed: remarks,
          meeting_endorsed: meeting,
          date_endorsed: date,
        },
      })

      revalidateData()
      enqueueSnackbar(<>APR endorsed.</>, {
        variant: 'success',
      })
    } catch (e) {
      // TODO: better error reporting
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    }
  }

  const onClose = () => {
    setIsModalOpen(false)
    setErrors([])
  }

  return (
    <Modal open={isModalOpen} onClose={onClose}>
      <Box className="flex w-full max-w-lg flex-col px-0 absolute-center">
        <Typography className="mx-6 mb-4 mt-1 text-2xl font-medium">
          Endorse APR
        </Typography>
        <form
          method="POST"
          id="endorse-modal-form"
          className="my-2 flex flex-col gap-y-4 bg-[#f5f5f5] px-6 py-2"
          onSubmit={formSubmit}
          autoComplete="off"
        >
          <FieldPopoverInput
            className={cx('!ml-0', {
              '!cursor-not-allowed': disabled,
            })}
            label="ExCom meeting number"
            id="meeting_endorsed"
            field="meeting_endorsed"
            options={meetingOptions}
            placeholder="Select meeting"
            withClear
            disabled={disabled}
            value={currentData?.meeting_endorsed?.toString()}
          />
          <div className="flex items-center">
            <label htmlFor="date_endorsed" className="w-48">
              Endorsement date
            </label>
            <TextField
              InputProps={{
                className: cx('bg-white', {
                  '!bg-gray-200': disabled,
                }),
              }}
              inputProps={{
                max: dayjs().format('YYYY-MM-DD'),
              }}
              id="date_endorsed"
              size="small"
              type="date"
              name="date_endorsed"
              disabled={disabled}
              defaultValue={currentData?.date_endorsed}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="remarks_endorsed" className="w-48">
              Remarks
            </label>
            <TextField
              InputProps={{
                className: cx('bg-white', {
                  'cursor-not-allowed !bg-gray-200': disabled,
                }),
              }}
              id="remarks_endorsed"
              name="remarks_endorsed"
              multiline
              disabled={disabled}
              defaultValue={currentData?.remarks_endorsed}
            />
          </div>
        </form>
        {errors.length > 0 && (
          <Alert
            className="mb-2"
            icon={<IoInformationCircleOutline size={24} />}
            severity="error"
          >
            <ul className="m-0 list-none p-0">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Alert>
        )}
        <div className="ml-auto mr-6 flex gap-3">
          <Button
            disabled={disabled}
            variant="contained"
            type="submit"
            form="endorse-modal-form"
          >
            Endorse
          </Button>
          <CancelButton onClick={onClose} />
        </div>
      </Box>
    </Modal>
  )
}
