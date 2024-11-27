'use client'

import { ApiBP } from '@ors/types/api_bp_get'

import React, { useContext } from 'react'

import cx from 'classnames'

import { Status, statusStyles } from '@ors/components/ui/StatusPill/StatusPill'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'

import { RedirectToBpList } from './RedirectToBpList'

const tagClassnames =
  'self-baseline rounded border border-solid px-1.5 py-1 font-medium uppercase leading-none'

type HeaderTagProps = {
  business_plan: any
  children: React.ReactNode
}

const HeaderTag = ({ business_plan, children }: HeaderTagProps) => {
  const { status } = business_plan || {}
  const {
    bgColor,
    border = '',
    textColor,
  } = statusStyles[status as Status] || {}

  return (
    <span className={cx(tagClassnames, bgColor, border, textColor)}>
      {children}
    </span>
  )
}

const ViewHeaderTag = () => {
  const { data } = useContext(BPContext) as any
  const business_plan = data?.results?.business_plan

  const { status } = business_plan || {}

  return <HeaderTag business_plan={business_plan}>{status}</HeaderTag>
}

const BPHeader = ({
  business_plan,
  tag,
  titlePrefix,
}: {
  business_plan: ApiBP
  tag?: React.JSX.Element
  titlePrefix?: React.JSX.Element
}) => {
  const fullLabel = `${business_plan?.agency.name} ${business_plan?.year_start} - ${business_plan?.year_end}`

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
      <div className="flex flex-wrap items-center gap-x-2">
        {titlePrefix}
        <h1 className="m-0 text-5xl leading-normal">{fullLabel}</h1>
        {tag}
      </div>
    </div>
  )
}

const BPHeaderView = ({
  actions,
  tag = <ViewHeaderTag />,
  titlePrefix,
  viewType = 'view',
}: {
  actions?: React.JSX.Element
  tag?: React.JSX.Element
  titlePrefix?: React.JSX.Element
  viewType?: string
}) => {
  const contextBP = useContext(BPContext) as any
  const { data } = contextBP
  const business_plan = data?.results?.business_plan || ({} as ApiBP)

  const currentYearRange =
    business_plan?.year_start + '-' + business_plan?.year_end

  return (
    !!data && (
      <div>
        <RedirectToBpList {...{ currentYearRange }} />
        <div className="mb-4 flex min-h-[40px] flex-wrap items-center justify-between gap-x-8 gap-y-2">
          <BPHeader {...{ business_plan, tag, titlePrefix, viewType }} />
          <div className="ml-auto">{actions}</div>
        </div>
      </div>
    )
  )
}

export default BPHeaderView
