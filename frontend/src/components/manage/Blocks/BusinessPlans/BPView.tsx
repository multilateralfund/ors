'use client'
import { useContext } from 'react'

import BusinessPlansTable from '@ors/components/manage/Blocks/Table/BusinessPlansTable/BusinessPlansTable'
import Loading from '@ors/components/theme/Loading/Loading'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'
import BPProvider from '@ors/contexts/BusinessPlans/BPProvider'

import { BPHeaderView } from './BPHeader'

export default function BPViewWrapper() {
  return (
    <BPProvider>
      <BPView />
    </BPProvider>
  )
}

function BPView() {
  const contextBP = useContext(BPContext) as any

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={contextBP?.loading}
      />
      <BPHeaderView />
      <BusinessPlansTable />
    </>
  )
}
