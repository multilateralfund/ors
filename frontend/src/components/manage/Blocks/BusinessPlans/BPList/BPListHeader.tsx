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
import Field from '@ors/components/manage/Form/Field'
import { bpTypes } from '../constants'
import { capitalize } from 'lodash'

const BPListHeader = ({
  viewType,
  params,
  setParams,
}: {
  viewType: string
  params?: any
  setParams?: any
}) => {
  const { user_type } = useStore((state) => state.user?.data)
  const { bpType, setBPType } = useStore((state) => state.bpType)

  const [pathname] = useLocation()
  const { yearRanges } = useContext(BPYearRangesContext) as any
  const period = getPathPeriod(pathname)
  const { periodOptions } = useGetBpPeriods(yearRanges)

  return (
    <div className="mb-8 flex items-center justify-between">
      <div className={cx('flex flex-row flex-wrap gap-2', styles.moreOptions)}>
        <PageHeading className="min-w-fit">Business Plan</PageHeading>
        {params && (
          <>
            <PeriodSelector
              label=""
              period={period}
              periodOptions={[...periodOptions]}
            />
            <Field
              FieldProps={{ className: 'ml-2 mb-0 w-36 BPList' }}
              options={bpTypes}
              value={
                params.bp_status || params.status
                  ? capitalize(
                      viewType === 'activities'
                        ? params.bp_status
                        : params.status,
                    )
                  : 'Endorsed'
              }
              widget="autocomplete"
              isOptionEqualToValue={(option, value) =>
                option.id === value.toLowerCase()
              }
              onChange={(_: any, value: any) => {
                setBPType(value.id)

                if (viewType === 'activities') {
                  setParams({
                    bp_status: capitalize(value.id),
                    offset: 0,
                  })
                } else {
                  setParams({
                    status: capitalize(value.id),
                    offset: 0,
                  })
                }
              }}
              disableClearable
            />
          </>
        )}
      </div>
      {userCanEditBusinessPlan[user_type as UserType] && (
        <div className="flex gap-4">
          <CustomLink
            className="px-4 py-2 text-lg uppercase"
            color="secondary"
            href="/business-plans/upload"
            variant="contained"
            button
          >
            Upload
          </CustomLink>
          {viewType === 'activities' && (
            <CustomLink
              className="px-4 py-2 text-lg uppercase"
              color="secondary"
              href={`${pathname}/${bpType}/edit`}
              variant="contained"
              button
            >
              Revise {bpType} BP
            </CustomLink>
          )}
        </div>
      )}
    </div>
  )
}

export default BPListHeader
