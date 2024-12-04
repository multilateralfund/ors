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
import { capitalize, find, indexOf } from 'lodash'
import SimpleSelect from '@ors/components/ui/SimpleSelect/SimpleSelect'

const BPListHeader = ({
  viewType,
  params,
  setParams,
  setParamsFiles,
  setParamsBpActivities,
}: {
  viewType: string
  params: any
  setParams: any
  setParamsFiles?: any
  setParamsBpActivities?: any
}) => {
  const { user_type } = useStore((state) => state.user?.data)
  const { setBPType, bpType } = useStore((state) => state.bpType)

  const [pathname] = useLocation()
  const { yearRanges } = useContext(BPYearRangesContext) as any
  const period = getPathPeriod(pathname)
  const { periodOptions } = useGetBpPeriods(yearRanges)

  const currentStatus = find(
    bpTypes,
    (type) =>
      type.label ===
      (viewType === 'activities' ? params.bp_status : params.status),
  )
  const statusIndex = indexOf(bpTypes, currentStatus)

  return (
    <div className="mb-8 flex items-center justify-between">
      <div className={cx('flex flex-row flex-wrap gap-2', styles.moreOptions)}>
        <PageHeading className="min-w-fit">Business Plan:</PageHeading>
        <PeriodSelector
          label=""
          period={period}
          periodOptions={[...periodOptions]}
          inputClassName="h-10 w-32"
          menuClassName="w-32"
        />
        <SimpleSelect
          className="capitalize"
          initialIndex={statusIndex}
          inputClassName="gap-x-4 h-10 w-36"
          menuClassName="w-36"
          label={''}
          options={bpTypes}
          onChange={({ value }: any) => {
            setBPType(capitalize(value))

            if (viewType === 'activities') {
              setParams({
                bp_status: capitalize(value),
                offset: 0,
              })
            } else if (viewType === 'details') {
              setParams({
                status: capitalize(value),
                offset: 0,
              })
              if (setParamsBpActivities && setParamsFiles) {
                setParamsBpActivities({
                  bp_status: capitalize(value),
                  offset: 0,
                })
                setParamsFiles({
                  status: capitalize(value),
                  offset: 0,
                })
              }
            } else {
              setParams({
                status: capitalize(value),
                offset: 0,
              })
            }
          }}
        />
      </div>
      {userCanEditBusinessPlan[user_type as UserType] &&
        viewType === 'activities' && (
          <CustomLink
            className="px-4 py-2 text-lg uppercase"
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
