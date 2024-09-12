'use client'

import React, { useContext } from 'react'

import cx from 'classnames'

import { Status } from '@ors/components/ui/StatusPill/StatusPill'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'

import { BackButton } from '../BackButton'

const tagClassnames =
  'self-baseline rounded border border-solid px-1.5 py-1 font-medium uppercase leading-none'

type HeaderTagProps = {
  business_plan: any
}

type BusinessPlanVersionsInterface = {
  is_latest: boolean
  status: Status
  version: number
}

const HeaderTag = ({ business_plan }: HeaderTagProps) => {
  const { is_latest, version }: BusinessPlanVersionsInterface =
    business_plan || {}

  return (
    <span
      className={cx('border-transparent bg-primary text-white', tagClassnames)}
    >
      {is_latest ? 'Latest' : `Version ${version}`}
    </span>
  )
}

const BPEditHeader = () => {
  const contextBP = useContext(BPContext) as any
  const { data } = contextBP
  const business_plan = data?.results?.business_plan || {}

  const currentYearRange =
    business_plan?.year_start + '-' + business_plan?.year_end

  const fullLabel = `${business_plan?.agency?.name} ${business_plan?.year_start} - ${business_plan?.year_end}`

  return (
    !!data && (
      <div>
        <BackButton
          agency={business_plan?.agency.name}
          period={currentYearRange}
        />
        <div className="mb-4 flex min-h-[40px] flex-wrap items-center justify-between gap-x-8 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-2">
            <p className="m-0 text-4xl leading-normal">Make changes for:</p>
            <h1 className="m-0 text-5xl leading-normal">{fullLabel}</h1>
            <HeaderTag business_plan={business_plan} />
          </div>
        </div>
      </div>
    )
  )
}

export default BPEditHeader
