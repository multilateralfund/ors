import { ChangeEvent } from 'react'

import { reverse } from 'lodash'

import { useStore } from '@ors/store'

import PopoverInput from '../../Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import { PeriodSelectorOption } from '../../Replenishment/types'
import SimpleInput from '../../Section/ReportInfo/SimpleInput'
import { INavigationButton } from '../types'
import BPMainFilters from './BPMainFilters'
import { NavigationButton } from './NavigationButton'
import { Label } from './helpers'

interface IBPUploadFilters {
  periodOptions: PeriodSelectorOption[]
  setFilters: any
}

const BPUploadFilters = ({
  periodOptions,
  setFilters,
  ...rest
}: IBPUploadFilters & Omit<INavigationButton, 'direction'>) => {
  const projectSlice = useStore((state) => state.projects)
  const meetings = projectSlice.meetings.data
  const formattedMeetings = meetings?.map((meeting: any) => ({
    label: meeting.number,
    value: meeting.id,
    year: meeting.date ? new Date(meeting.date).getFullYear() : '-',
  }))
  const meetingOptions = reverse(formattedMeetings)

  const handleChangeMeeting = (meeting: string) => {
    setFilters((prevFilters: any) => ({
      ...prevFilters,
      meeting,
    }))
  }

  const handleChangeDecision = (event: ChangeEvent<HTMLInputElement>) => {
    setFilters((prevFilters: any) => ({
      ...prevFilters,
      decision: event.target.value,
    }))
  }

  return (
    <>
      <p className="m-0 text-2xl">Choose Business Plan</p>
      <div className="flex gap-20">
        <BPMainFilters {...{ periodOptions, setFilters }} />
      </div>
      <div className="flex gap-20">
        <div className="w-36">
          <Label isRequired>Meeting</Label>
          <PopoverInput
            className="!m-0 h-10 !py-1"
            clearBtnClassName="right-1"
            options={meetingOptions}
            withClear={true}
            onChange={handleChangeMeeting}
            onClear={() => handleChangeMeeting('')}
          />
        </div>
        <div className="h-10">
          <Label>Decision number (optional)</Label>
          <SimpleInput
            id="decision"
            className="!border-black"
            label=""
            type="text"
            onChange={handleChangeDecision}
          />
        </div>
      </div>
      <NavigationButton {...rest} direction={'next'} />
    </>
  )
}

export default BPUploadFilters
