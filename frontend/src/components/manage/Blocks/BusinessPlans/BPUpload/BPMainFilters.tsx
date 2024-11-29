import Field from '@ors/components/manage/Form/Field'
import SimpleSelect from '@ors/components/ui/SimpleSelect/SimpleSelect'

import { PeriodSelectorOption } from '../../Replenishment/types'
import { bpTypes } from '../constants'
import { Label, getFormattedPeridOptions } from './helpers'

interface IStatus {
  label: string
  value: string
}

interface IBPUploadFilters {
  periodOptions: PeriodSelectorOption[]
  setFilters: any
}

const BPMainFilters = ({ periodOptions, setFilters }: IBPUploadFilters) => {
  const formattedPeriodOptions = getFormattedPeridOptions(periodOptions)

  const handleChangeTriennium = (triennium: PeriodSelectorOption) => {
    setFilters((prevFilters: any) => {
      const [year_start, year_end] = triennium.value.split('-')
      return { ...prevFilters, year_end, year_start }
    })
  }

  const handleChangeStatus = (status: IStatus) => {
    setFilters((prevFilters: any) => ({
      ...prevFilters,
      status: status?.label ?? null,
    }))
  }

  return (
    <>
      <div className="w-36 justify-items-start">
        <Label isRequired>Triennium</Label>
        <SimpleSelect
          className="!gap-x-0"
          initialIndex={1}
          inputClassName="gap-x-4 h-10"
          label={''}
          options={formattedPeriodOptions}
          onChange={handleChangeTriennium}
        />
      </div>
      <div>
        <Label isRequired>Status</Label>
        <Field
          FieldProps={{ className: 'mb-0 w-40 BPListUpload' }}
          options={bpTypes}
          widget="autocomplete"
          onChange={(_: any, value: any) => handleChangeStatus(value)}
        />
      </div>
    </>
  )
}

export default BPMainFilters
