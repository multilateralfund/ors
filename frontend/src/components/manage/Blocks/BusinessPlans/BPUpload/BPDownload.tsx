import { useState } from 'react'

import cx from 'classnames'

import Link from '@ors/components/ui/Link/Link'
import { formatApiUrl } from '@ors/helpers'

import { PeriodSelectorOption } from '../../Replenishment/types'
import { INavigationButton } from '../types'
import BPMainFilters from './BPMainFilters'
import { NavigationButton } from './NavigationButton'

interface IBPUploadFilters {
  filters: any
  periodOptions: PeriodSelectorOption[]
}

const BPDownload = ({
  filters,
  periodOptions,
  ...rest
}: IBPUploadFilters & Omit<INavigationButton, 'direction'>) => {
  const currentYearRange = periodOptions[0].value
  const [intitial_year_start, initial_year_end] = currentYearRange.split('-')

  const [downloadFilters, setDownloadFilters] = useState<any>({
    year_end: intitial_year_start,
    year_start: initial_year_end,
  })

  const { status, year_end, year_start } = downloadFilters
  const isDownloadButtonEnabled = year_start && status

  return (
    <>
      <p className="m-0 text-2xl">Download Business Plan</p>
      <div className="flex gap-4">
        <BPMainFilters {...{ periodOptions }} setFilters={setDownloadFilters} />
      </div>
      <p className="mb-0 mt-1 text-xl">Meeting: {filters.meeting}</p>
      <div className="flex items-center gap-2.5">
        <Link
          className={cx(
            'mt-5 h-10 border border-solid border-primary px-3 py-1',
            {
              'border-0': !isDownloadButtonEnabled,
            },
          )}
          disabled={!isDownloadButtonEnabled}
          prefetch={false}
          size="large"
          // @ts-ignore
          target="_blank"
          variant="contained"
          href={formatApiUrl(
            `/api/business-plan-activity/export/?year_start=${year_start}&year_end=${year_end}&bp_status=${status}`,
          )}
          button
          download
        >
          Download
        </Link>
        <NavigationButton {...rest} direction={'next'} />
        <NavigationButton {...rest} direction={'back'} />
      </div>
    </>
  )
}

export default BPDownload
