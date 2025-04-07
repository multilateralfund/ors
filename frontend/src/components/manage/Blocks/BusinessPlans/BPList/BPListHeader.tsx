import { UserType, userCanEditBusinessPlan } from '@ors/types/user_types'

import { useLocation } from 'wouter'
import cx from 'classnames'
import styles from '@ors/app/business-plans/list/styles.module.css'

import { PageHeading } from '@ors/components/ui/Heading/Heading'
import CustomLink from '@ors/components/ui/Link/Link'
import { useStore } from '@ors/store'
import useGetBpPeriods from './useGetBPPeriods'
import { useContext } from 'react'
import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import PeriodSelector from '../../Replenishment/PeriodSelector'
import { getPathPeriod } from '../../Replenishment/utils'
import { bpTypes } from '../constants'
import { capitalize, filter, find, indexOf, map } from 'lodash'
import SimpleSelect from '@ors/components/ui/SimpleSelect/SimpleSelect'
import { getCurrentPeriodOption } from '../utils'

const BPListHeader = ({
  viewType,
  setParams,
  setParamsFiles,
  setParamsActivities,
}: {
  viewType: string
  setParams: any
  setParamsFiles?: any
  setParamsActivities?: any
}) => {
  const { user_type } = useStore((state) => state.user?.data)
  const { setBPType, bpType } = useStore((state) => state.bpType)

  const [pathname] = useLocation()
  const { yearRanges } = useContext(BPYearRangesContext) as any
  const { periodOptions } = useGetBpPeriods(yearRanges)
  const period = getPathPeriod(pathname)

  const currentStatus = find(bpTypes, (type) => type.label === bpType)
  const statusIndex = indexOf(bpTypes, currentStatus)

  const currentPeriod = getCurrentPeriodOption(
    periodOptions,
    period?.split('-')[0] || '',
  )

  const filteredPeriods = filter(
    periodOptions,
    (period) => period.status?.length !== 0,
  )
  const formattedBpTypes = map(bpTypes, (bpType) => ({
    ...bpType,
    disabled: !currentPeriod?.status.includes(bpType.label),
  }))

  return (
    <div className="mb-8 flex items-center justify-between gap-4">
      <div className="flex flex-row flex-wrap gap-2">
        <PageHeading className="min-w-fit">Business Plan:</PageHeading>
        <div
          className={cx('flex flex-row flex-wrap gap-2', styles.moreOptions)}
        >
          <PeriodSelector
            label=""
            period={period}
            periodOptions={filteredPeriods}
            inputClassName="h-10 w-32"
            menuClassName="w-32"
          />
          <SimpleSelect
            withDisabledOptions
            className="capitalize"
            initialIndex={statusIndex}
            inputClassName="gap-x-4 h-10 w-36"
            menuClassName="w-36"
            placeholder="Status"
            label={''}
            options={formattedBpTypes}
            onChange={({ value }: any) => {
              const formattedValue = capitalize(value)

              setBPType(formattedValue)
              setParams({
                ...(viewType === 'activities'
                  ? { bp_status: formattedValue }
                  : { status: formattedValue }),
                offset: 0,
              })

              if (viewType === 'report_info') {
                setParamsActivities({
                  bp_status: formattedValue,
                  offset: 0,
                })
                setParamsFiles({
                  status: formattedValue,
                  offset: 0,
                })
              }
            }}
          />
        </div>
      </div>
      {userCanEditBusinessPlan[user_type as UserType] && (
        <CustomLink
          className="text-nowrap px-4 py-2 text-lg uppercase"
          color="secondary"
          href="/business-plans/upload"
          variant="contained"
          button
        >
          Upload BP
        </CustomLink>
      )}
    </div>
  )
}

export default BPListHeader
