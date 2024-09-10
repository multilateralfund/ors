import { useState } from 'react'

import Tooltip from '@mui/material/Tooltip'
import cx from 'classnames'
import Link from 'next/link'

import { formatApiUrl } from '@ors/helpers'
import useClickOutside from '@ors/hooks/useClickOutside'

import { IDownloadReportProps } from './typesDownloadReport'

import { AiFillFileExcel, AiFillFilePdf } from 'react-icons/ai'
import { IoDownloadOutline } from 'react-icons/io5'

function DownloadReport(props: IDownloadReportProps) {
  const { archive, convertData, report } = props

  const [showMenu, setShowMenu] = useState(false)

  const toggleShowMenu = () => setShowMenu((prev) => !prev)

  const ref = useClickOutside(() => {
    setShowMenu(false)
  })

  const urlXLS = `${formatApiUrl(`api/country-programme${archive ? '-archive' : ''}/export/`)}?cp_report_id=${report.data?.id.toString()}&convert_data=${convertData}`
  const urlPDF = `${formatApiUrl(`api/country-programme${archive ? '-archive' : ''}/print/`)}?cp_report_id=${report.data?.id.toString()}&convert_data=${convertData}`

  return (
    <div className="relative">
      <div
        className="flex cursor-pointer items-center justify-between text-nowrap"
        ref={ref}
        onClick={toggleShowMenu}
      >
        <Tooltip placement="top" title="Download">
          <div className="flex items-center justify-between gap-x-2">
            <span>Download</span>
            <IoDownloadOutline className="text-xl text-secondary" />
          </div>
        </Tooltip>
      </div>
      <div
        className={cx(
          'absolute left-0 z-10 max-h-[200px] origin-top overflow-y-auto rounded-md border border-solid border-gray-300 bg-gray-A100 opacity-0 transition-all',
          {
            'collapse scale-y-0': !showMenu,
            'scale-y-100 opacity-100': showMenu,
          },
        )}
      >
        <Link
          className="flex items-center gap-x-2 text-nowrap px-2 py-1 text-base text-black no-underline transition-all hover:bg-primary hover:text-mlfs-hlYellow"
          href={urlXLS}
          prefetch={false}
          target="_blank"
          download
        >
          <AiFillFileExcel className="fill-green-700" size={24} />
          <span>XLSX</span>
        </Link>
        <Link
          className="flex items-center gap-x-2 text-nowrap px-2 py-1 text-base text-black no-underline transition-all hover:bg-primary hover:text-mlfs-hlYellow"
          href={urlPDF}
          prefetch={false}
          target="_blank"
          download
        >
          <AiFillFilePdf className="fill-red-700" size={24} />
          <span>PDF</span>
        </Link>
      </div>
    </div>
  )
}

export default DownloadReport
