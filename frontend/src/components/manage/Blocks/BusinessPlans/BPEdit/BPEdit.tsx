'use client'

import BPProvider from '@ors/contexts/BusinessPlans/BPProvider'

import { RedirectToBpList } from '../RedirectToBpList'
import ExportBPActivities from './BPExportActivities'

export default function BPEdit(props: any) {
  const { period } = props

  return (
    <BPProvider>
      <div className="flex flex-col gap-2">
        <RedirectToBpList currentYearRange={period} />
        <ExportBPActivities {...props} />
      </div>
    </BPProvider>
  )
}
