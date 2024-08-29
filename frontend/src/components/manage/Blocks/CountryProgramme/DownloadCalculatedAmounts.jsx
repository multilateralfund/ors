'use client'

import { useState } from 'react'

import { Tooltip } from '@mui/material'
import cx from 'classnames'

import Link from '@ors/components/ui/Link/Link'
import { formatApiUrl } from '@ors/helpers/Api/utils'
import useClickOutside from '@ors/hooks/useClickOutside'

import { AiFillFileExcel, AiFillFilePdf } from 'react-icons/ai'

function DownloadCalculatedAmounts(props) {
  const { report } = props

  const [showMenu, setShowMenu] = useState(false)

  const toggleShowMenu = () => setShowMenu((prev) => !prev)

  const ref = useClickOutside(() => {
    setShowMenu(false)
  })

  const urlXLS = `${formatApiUrl('/api/country-programme/calculated-amount/export/')}?cp_report_id=${report.data?.id.toString()}`
  const urlPDF = `${formatApiUrl('/api/country-programme/calculated-amount/print/')}?cp_report_id=${report.data?.id.toString()}`

  return (
    <div className="relative">
      <div
        className="flex cursor-pointer items-center justify-between gap-x-2 text-nowrap rounded-md border border-solid border-primary px-2 py-1 text-base text-black no-underline hover:bg-primary hover:text-mlfs-hlYellow"
        ref={ref}
        onClick={toggleShowMenu}
      >
        <Tooltip placement="top" title="Download calculated amounts">
          <span>Calculated amounts</span>
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
          target="_blank"
          download
        >
          <AiFillFileExcel className="fill-green-700" size={24} />
          <span>XLSX</span>
        </Link>
        <Link
          className="flex items-center gap-x-2 text-nowrap px-2 py-1 text-base text-black no-underline transition-all hover:bg-primary hover:text-mlfs-hlYellow"
          href={urlPDF}
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

export default DownloadCalculatedAmounts
