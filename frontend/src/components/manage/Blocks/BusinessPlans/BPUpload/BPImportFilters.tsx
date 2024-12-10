import PopoverInput from '../../Replenishment/StatusOfTheFund/editDialogs/PopoverInput'
import { PeriodSelectorOption } from '../../Replenishment/types'
import { IDecision, INavigationButton } from '../types'
import BPMainFilters from './BPMainFilters'
import { NavigationButton } from './NavigationButton'
import { Label } from './helpers'
import { getDecisionOptions, getMeetingOptions } from '../utils'
import Field from '@ors/components/manage/Form/Field'

interface IBPImportFilters {
  periodOptions: PeriodSelectorOption[]
  filters: any
  setFilters: any
}

const BPImportFilters = ({
  periodOptions,
  filters,
  setFilters,
  ...rest
}: IBPImportFilters & Omit<INavigationButton, 'direction'>) => {
  const handleChangeMeeting = (meeting: string) => {
    setFilters((prevFilters: any) => ({
      ...prevFilters,
      meeting,
      decision: null,
    }))
  }

  const handleChangeDecision = (decision: IDecision) => {
    setFilters((prevFilters: any) => ({
      ...prevFilters,
      decision: decision?.value,
    }))
  }

  return (
    <>
      <p className="m-0 text-2xl">Choose Business Plan</p>
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <BPMainFilters {...{ periodOptions, setFilters }} isFirstStepUpload />
      </div>
      <div className="flex flex-wrap gap-x-20 gap-y-3">
        <div className="w-64">
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
        </div>
        <div>
          <Label>Decision number (optional)</Label>
          <Field
            key={filters?.meeting}
            FieldProps={{ className: 'mb-0 w-40 BPListUpload' }}
            options={getDecisionOptions(filters?.meeting)}
            widget="autocomplete"
            onChange={(_: any, value: any) => handleChangeDecision(value)}
          />
        </div>
      </div>
      <NavigationButton {...rest} direction={'next'} />
    </>
  )
}

export default BPImportFilters
