import React from 'react'

import VersionHistoryList from '@ors/components/ui/VersionDetails/VersionHistoryList'
import { useStore } from '@ors/store'

const ReportHistory = () => {
  const { report } = useStore((state) => state.cp_reports)
  const history = report.data?.history
  const currentDataVersion = report.data?.version

  return (
    <VersionHistoryList
      currentDataVersion={currentDataVersion}
      historyList={history}
      length={3}
      type="report"
    />
  )
}

export default React.memo(ReportHistory)
