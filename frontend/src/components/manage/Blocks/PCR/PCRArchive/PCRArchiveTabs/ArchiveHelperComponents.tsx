import { Dispatch, SetStateAction } from 'react'

import { VersionsDropdown } from '../../PCRView/PCRViewTabs/ViewHelperComponents'
import { ArchivePCRResponse } from '../../interfaces'

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
