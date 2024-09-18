'use client'

import { ApiBP } from '@ors/types/api_bp_get'

import { useContext } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'
import BPProvider from '@ors/contexts/BusinessPlans/BPProvider'

import { useGetBPDiff } from './useGetBPDiff'

const BpDiff = ({ business_plan }: { business_plan: ApiBP }) => {
  const bpDiff = useGetBPDiff(business_plan)
  console.log(bpDiff)
  return <></>
}
const BpDiffView = () => {
  const { data, loaded } = useContext(BPContext) as any
  const business_plan = data?.results?.business_plan || ({} as ApiBP)

  if (!loaded) return <Loading />

  return <BpDiff {...{ business_plan }} />
}

export default function BPDiffViewWrapper() {
  return (
    <BPProvider>
      <BpDiffView />
    </BPProvider>
  )
}
