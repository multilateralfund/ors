import { ChangeEvent } from 'react'

import PopoverInput from '../../Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import { PeriodSelectorOption } from '../../Replenishment/types'
import SimpleInput from '../../Section/ReportInfo/SimpleInput'
import { INavigationButton } from '../types'
import BPMainFilters from './BPMainFilters'
import { NavigationButton } from './NavigationButton'
import { Label } from './helpers'
import { getMeetingOptions } from '../utils'

interface IBPImportFilters {
  periodOptions: PeriodSelectorOption[]
  setFilters: any
}

const BPImportFilters = ({
  periodOptions,
  setFilters,
  ...rest
}: IBPImportFilters & Omit<INavigationButton, 'direction'>) => {
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
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <BPMainFilters {...{ periodOptions, setFilters }} isFirstUploadStep />
      </div>
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div className="w-36">
          <Label isRequired>Meeting</Label>
          <PopoverInput
            className="!m-0 h-10 !py-1"
            clearBtnClassName="right-1"
            options={getMeetingOptions()}
            withClear={true}
            onChange={handleChangeMeeting}
            onClear={() => handleChangeMeeting('')}
          />
        </div>
        <div>
          <Label>Decision number (optional)</Label>
          <SimpleInput
            id="decision"
            className="!border-black"
            label=""
            type="text"
            onChange={handleChangeDecision}
            containerClassName="!justify-normal"
          />
        </div>
      </div>
      <NavigationButton {...rest} direction={'next'} />
    </>
  )
}

export default BPImportFilters
