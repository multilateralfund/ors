import { find, indexOf } from 'lodash'

import Field from '@ors/components/manage/Form/Field'
import SimpleSelect from '@ors/components/ui/SimpleSelect/SimpleSelect'

import { PeriodSelectorOption } from '../../Replenishment/types'
import { bpTypes } from '../constants'
import { Label } from './helpers'
import { getCurrentPeriodOption } from '../utils'

interface IStatus {
  label: string
  value: string
}

interface IBPMainFilters {
  filters?: any
  periodOptions: PeriodSelectorOption[]
  setFilters: any
}

const BPMainFilters = ({
  filters,
  periodOptions,
  setFilters,
}: IBPMainFilters) => {
  const currentPeriod = getCurrentPeriodOption(
    periodOptions,
    filters?.year_start,
  )
  const currentPeriodIndex = indexOf(periodOptions, currentPeriod)

  const handleChangeTriennium = (triennium: PeriodSelectorOption) => {
    setFilters((prevFilters: any) => {
      const [year_start, year_end] = triennium.value.split('-')
      return { ...prevFilters, year_end, year_start }
    })
  }

  const handleChangeStatus = (status: IStatus) => {
    setFilters((prevFilters: any) => ({
      ...prevFilters,
      bp_status: status?.label ?? null,
    }))
  }

  return (
    <>
      <div className="w-36 justify-items-start">
        <Label isRequired>Triennium</Label>
        <SimpleSelect
          className="!gap-x-0"
          initialIndex={filters ? currentPeriodIndex : 1}
          inputClassName="gap-x-4 h-10"
          label={''}
          options={periodOptions}
          onChange={handleChangeTriennium}
        />
      </div>
      <div>
        <Label isRequired>Status</Label>
        <Field
          FieldProps={{ className: 'mb-0 w-40 BPListUpload' }}
          options={bpTypes}
          value={filters?.bp_status}
          widget="autocomplete"
          onChange={(_: any, value: any) => handleChangeStatus(value)}
        />
      </div>
    </>
  )
}

export default BPMainFilters
