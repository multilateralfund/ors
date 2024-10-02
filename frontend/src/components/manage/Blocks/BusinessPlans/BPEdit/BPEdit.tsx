'use client'

import React, { useContext } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'
import BPProvider from '@ors/contexts/BusinessPlans/BPProvider'
import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'

import BusinessPlansEditTable from './BPEditTable'
import BPHeaderEdit from './BPHeaderEdit'

function BPEdit() {
  const { loading } = useContext(BPContext) as any

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <BPHeaderEdit />
      <BusinessPlansEditTable />
    </>
  )
}

export default function BPEditWrapper() {
  return (
    <BPYearRangesProvider>
      <BPProvider>
        <BPEdit />
      </BPProvider>
    </BPYearRangesProvider>
  )
}
