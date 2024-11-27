import { ChangeEvent, ReactNode } from 'react'

import cx from 'classnames'
import { reverse } from 'lodash'

import Field from '@ors/components/manage/Form/Field'
import SimpleSelect from '@ors/components/ui/SimpleSelect/SimpleSelect'
import { useStore } from '@ors/store'

import PopoverInput from '../../Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import { PeriodSelectorOption } from '../../Replenishment/types'
import SimpleInput from '../../Section/ReportInfo/SimpleInput'
import { bpTypes } from '../constants'

const BPUploadFilters = ({
  currentStep,
  periodOptions,
  setFilters,
  step,
}: {
  currentStep: number
  periodOptions: PeriodSelectorOption[]
  setFilters: any
  step: number
}) => {
  const projectSlice = useStore((state) => state.projects)
  const meetings = projectSlice.meetings.data
  const formattedMeetings = meetings?.map((meeting: any) => ({
    label: meeting.number,
    value: meeting.id,
    year: meeting.date ? new Date(meeting.date).getFullYear() : '-',
  }))
  const meetingOptions = reverse(formattedMeetings)

  const isCurrentStep = currentStep === step

  const handleChangeTriennium = (triennium: PeriodSelectorOption) => {
    setFilters((prevFilters: any) => {
      const [year_start, year_end] = triennium.value.split('-')
      return { ...prevFilters, year_end, year_start }
    })
  }

  const handleChangeStatus = (status: { label: string; value: string }) => {
    setFilters((prevFilters: any) => ({
      ...prevFilters,
      status: status?.label ?? null,
    }))
  }

  const handleChangeMeeting = (value: string) => {
    setFilters((prevFilters: any) => ({
      ...prevFilters,
      meeting: value,
    }))
  }

  const handleChangeDecision = (event: ChangeEvent<HTMLInputElement>) => {
    setFilters((prevFilters: any) => ({
      ...prevFilters,
      decision: event.target.value,
    }))
  }

  const Label = ({ children }: { children: ReactNode }) => (
    <label className="mb-2 block text-lg font-normal text-gray-900">
      {children}
      <sup className="font-bold">*</sup>
    </label>
  )

  return (
    <div
      className={cx('mt-4 flex flex-col gap-y-3', {
        'pointer-events-none opacity-50': !isCurrentStep,
      })}
    >
      <div className="flex gap-20">
        <div className="w-36 justify-items-start">
          <Label>Triennium</Label>
          <SimpleSelect
            className="!gap-x-0"
            initialIndex={0}
            inputClassName="gap-x-4"
            label={''}
            options={periodOptions}
            onChange={handleChangeTriennium}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Field
            FieldProps={{ className: 'mb-0 w-40 BPList' }}
            options={bpTypes}
            widget="autocomplete"
            onChange={(_: any, value: any) => handleChangeStatus(value)}
          />
        </div>
      </div>
      <div className="flex gap-20">
        <div className="w-36">
          <Label>Meeting</Label>
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
          <Label>Decision number</Label>
          <SimpleInput
            id="decision"
            className="!border-black"
            label=""
            type="text"
            onChange={handleChangeDecision}
          />
        </div>
      </div>
    </div>
  )
}

export default BPUploadFilters
