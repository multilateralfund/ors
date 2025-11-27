import React, { Dispatch, FormEvent, SetStateAction } from 'react'
import { Box, Modal, TextField, Typography } from '@mui/material'
import Button from '@mui/material/Button'
import { CancelButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents.tsx'
import { FieldPopoverInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { useStore } from '@ors/store.tsx'
import { reverse } from 'lodash'

interface EndorseAPRModalProps {
  isModalOpen: boolean
  setIsModalOpen: Dispatch<SetStateAction<boolean>>
  disabled: boolean
}

export default function EndorseAprModal({
  isModalOpen,
  setIsModalOpen,
  disabled,
}: EndorseAPRModalProps) {
  const projectSlice = useStore((state) => state.projects)
  const meetings = projectSlice.meetings.data
  const formattedMeetings = meetings?.map((meeting: any) => ({
    label: meeting.number,
    value: meeting.id,
  }))
  const meetingOptions = reverse(formattedMeetings)

  const formSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
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
            className="!ml-0"
            label="ExCom meeting number"
            id="meeting_id"
            field="meeting_id"
            options={meetingOptions}
            placeholder="Select meeting"
            withClear
          />
          <div className="flex items-center">
            <label htmlFor="date_endorsement" className="w-48">
              Endorsement date
            </label>
            <TextField
              InputProps={{
                className: 'bg-white',
              }}
              id="date_endorsement"
              size="small"
              type="date"
              name="date_endorsement"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="remarks" className="w-48">
              Remarks
            </label>
            <TextField
              InputProps={{
                className: 'bg-white',
              }}
              id="remarks"
              name="remarks"
              multiline
            />
          </div>
        </form>
        <div className="ml-auto mr-6 flex gap-3">
          <CancelButton onClick={() => setIsModalOpen(false)} />
          <Button
            // TODO: Endorsement when endpoint is ready
            disabled={disabled || true}
            variant="contained"
            type="submit"
            form="endorse-modal-form"
          >
            Endorse
          </Button>
        </div>
      </Box>
    </Modal>
  )
}
