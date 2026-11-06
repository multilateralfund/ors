import { Dispatch, SetStateAction } from 'react'

import { VersionsDropdown } from '../../PCRView/PCRViewTabs/ViewHelperComponents'
import { ArchivePCRResponse } from '../../interfaces'

import { Tooltip } from '@mui/material'
import cx from 'classnames'

export const LegacyPCRIcon = ({
  size = 'small',
  className,
}: {
  size?: 'small' | 'large'
  className?: string
}) => (
  <Tooltip title="Legacy PCR" placement="top" arrow>
    <span
      className={cx(
        'flex items-center justify-center rounded-full border-[1.5px] border-solid border-primary font-bold leading-none text-primary',
        size === 'large'
          ? 'h-[18px] w-[18px] text-[13px]'
          : 'h-[14px] w-[14px] text-[11px]',
        className,
      )}
    >
      L
    </span>
  </Tooltip>
)

export const ArchiveVersionsList = ({
  pcr,
  showVersionsMenu,
  setShowVersionsMenu,
}: {
  pcr: ArchivePCRResponse
  showVersionsMenu: boolean
  setShowVersionsMenu: Dispatch<SetStateAction<boolean>>
}) => {
  const versions = [
    { id: pcr.id, version: 1, status: pcr.status, latest_pcr_id: null },
  ]

  return (
    <div className="flex items-center gap-2">
      <VersionsDropdown
        {...{ versions, showVersionsMenu, setShowVersionsMenu }}
        getVersionHref={(id) => `/pcr/${pcr.meta_project_id}/archive/${id}`}
      />
      <span className="self-baseline whitespace-nowrap rounded bg-mlfs-hlYellow p-1 font-medium uppercase leading-none">
        Latest
      </span>
    </div>
  )
}
