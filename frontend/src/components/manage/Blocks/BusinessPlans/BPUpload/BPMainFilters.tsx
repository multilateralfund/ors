import { find, indexOf, map } from 'lodash'

import Field from '@ors/components/manage/Form/Field'
import SimpleSelect from '@ors/components/ui/SimpleSelect/SimpleSelect'

import { PeriodSelectorOption } from '../../Replenishment/types'
import { bpTypes } from '../constants'
import { Label } from './helpers'
import { getCurrentPeriodOption } from '../utils'
import cx from 'classnames'
import { useEffect } from 'react'

interface IStatus {
  label: string
  value: string
}

interface IBPMainFilters {
  filters?: any
  periodOptions: PeriodSelectorOption[]
  setFilters: any
  isFirstStepUpload?: boolean
}

const BPMainFilters = ({
  filters,
  periodOptions,
  setFilters,
  isFirstStepUpload,
}: IBPMainFilters) => {
  const step1PeriodOptions = map(periodOptions, (period) => {
    const nrBps = period.status?.length

    return {
      ...period,
      label:
        period.label + ` (${nrBps} ${nrBps === 1 ? 'bp' : 'bps'} available)`,
    }
  })
  const step2PeriodOptions = map(periodOptions, (period) => ({
    ...period,
    disabled: period.status?.length === 0,
  }))

  const currentPeriod = getCurrentPeriodOption(
    periodOptions,
    filters?.year_start,
  )
  const currentPeriodIndex = indexOf(periodOptions, currentPeriod)
  const formattedBpTypes = map(bpTypes, (bpType) => ({
    ...bpType,
    disabled: !currentPeriod?.status.includes(bpType.label),
  }))

  useEffect(() => {
    if (
      filters?.bp_status &&
      !currentPeriod?.status.includes(filters?.bp_status)
    ) {
      const availableBpType = find(
        currentPeriod?.status,
        (status) => status !== filters.bp_status,
      )
      setFilters((filters: any) => ({ ...filters, bp_status: availableBpType }))
    }
  }, [currentPeriod])

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
      <div
        className={cx('w-36 justify-items-start', {
          'w-64': isFirstStepUpload,
        })}
      >
        <Label isRequired={isFirstStepUpload}>Triennium</Label>
        <SimpleSelect
          className="!gap-x-0"
          initialIndex={filters ? Math.max(currentPeriodIndex, 0) : 0}
          inputClassName="gap-x-4 h-10"
          label={''}
          options={isFirstStepUpload ? step1PeriodOptions : step2PeriodOptions}
          onChange={handleChangeTriennium}
          withDisabledOptions
        />
      </div>
      <div>
        <Label isRequired={isFirstStepUpload}>Status</Label>
        <Field
          FieldProps={{ className: 'mb-0 w-40 BPListUpload' }}
          options={isFirstStepUpload ? bpTypes : formattedBpTypes}
          value={filters?.bp_status}
          widget="autocomplete"
          onChange={(_: any, value: any) => handleChangeStatus(value)}
          withDisabledOptions
        />
      </div>
    </>
  )
}

export default BPMainFilters
