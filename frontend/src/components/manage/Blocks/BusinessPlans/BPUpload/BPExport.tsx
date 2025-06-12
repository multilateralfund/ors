import { Dispatch, SetStateAction, useContext } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import Link from '@ors/components/ui/Link/Link'
import { formatApiUrl } from '@ors/helpers'
import { PeriodSelectorOption } from '../../Replenishment/types'
import { INavigationButton } from '../types'
import BPMainFilters from './BPMainFilters'
import { NavigationButton } from './NavigationButton'

import { IoInformationCircleOutline } from 'react-icons/io5'
import { Alert } from '@mui/material'
import cx from 'classnames'

interface IBPExport {
  downloadFilters: any
  filters: any
  periodOptions: PeriodSelectorOption[]
  setDownloadFilters: Dispatch<SetStateAction<any>>
}

const BPExport = ({
  downloadFilters,
  filters,
  periodOptions,
  setDownloadFilters,
  ...rest
}: IBPExport & Omit<INavigationButton, 'direction'>) => {
  const { bp_status, year_end, year_start } = downloadFilters
  const { year_end: headerYearEnd, year_start: headerYearStart } = filters

  const { canExportBp } = useContext(PermissionsContext)

  const isDownloadButtonEnabled = canExportBp && year_start && bp_status

  const downloadUrl = formatApiUrl(
    `/api/business-plan-activity/export/?year_start=${year_start}&year_end=${year_end}&bp_status=${bp_status}&header_year_start=${headerYearStart}&header_year_end=${headerYearEnd}`,
  )

  return (
    <>
      <p className="m-0 text-2xl">Download Business Plan</p>
      <div className="flex flex-wrap gap-x-4 gap-y-3">
        <BPMainFilters
          key={downloadFilters?.year_start}
          {...{ periodOptions }}
          filters={downloadFilters}
          setFilters={setDownloadFilters}
        />
      </div>
      {!canExportBp && (
        <Alert
          className="mt-2 w-fit"
          icon={<IoInformationCircleOutline size={24} />}
          severity="error"
        >
          <p className="m-0 text-lg">
            You are not authorized to download business plans!
          </p>
        </Alert>
      )}
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
          href={downloadUrl}
          button
          download
        >
          Download
        </Link>
        <NavigationButton {...rest} direction={'next'} title={'Next / Skip'} />
        <NavigationButton {...rest} direction={'back'} />
      </div>
    </>
  )
}

export default BPExport
