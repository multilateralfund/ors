'use client'

import { ApiBP } from '@ors/types/api_bp_get'
import { UserType, userCanEditBusinessPlan } from '@ors/types/user_types'

import React, { useContext, useState } from 'react'

import { Button } from '@mui/material'
import cx from 'classnames'
import NextLink from 'next/link'

import Link from '@ors/components/ui/Link/Link'
import { Status, statusStyles } from '@ors/components/ui/StatusPill/StatusPill'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'
import useClickOutside from '@ors/hooks/useClickOutside'
import { useStore } from '@ors/store'

import { useGetBPVersions } from './BP/useGetBPVersions'
import { RedirectToBpList } from './RedirectToBpList'
import { BPDataInterface } from './types'

import { IoChevronDown } from 'react-icons/io5'

const BPDiffButton = ({
  bpVersions,
  business_plan,
}: {
  bpVersions: BPDataInterface
  business_plan: ApiBP
}) => {
  const { agency, version, year_end, year_start } = business_plan
  const { name: agency_name } = agency || {}

  const { results = [] } = bpVersions

  const currentVersionObject = results.find(
    (result) => result.version === business_plan.version,
  )
  const currentVersionIndex = results.indexOf(currentVersionObject)
  const previousVersion = results[currentVersionIndex + 1]

  if (results.length <= 1 || !previousVersion) return null

  return (
    <Link
      className="px-5"
      color="secondary"
      prefetch={false}
      size="large"
      variant="contained"
      href={`/business-plans/${agency_name}/${year_start}-${year_end}/diff/${version}
       `}
      button
    >
      See differences
    </Link>
  )
}
const tagClassnames =
  'self-baseline rounded border border-solid px-1.5 py-1 font-medium uppercase leading-none'

const HeaderVersionsDropdown = ({
  bpVersions,
  viewType,
}: {
  bpVersions: BPDataInterface
  viewType?: string
}) => {
  const [showVersionsMenu, setShowVersionsMenu] = useState(false)
  const { data, loading, params, setParams } = useContext(BPContext)

  const business_plan = data?.results?.business_plan || ({} as ApiBP)
  const toggleShowVersionsMenu = () => setShowVersionsMenu((prev) => !prev)

  const ref = useClickOutside<HTMLDivElement>(() => {
    setShowVersionsMenu(false)
  })

  const { loading: versionsLoading, results: versionsData = [] } = bpVersions
  const versionsReady = business_plan || (!versionsLoading && !loading)

  const isView = viewType === 'view'

  const versions =
    isView && versionsReady && versionsData.length > 0
      ? versionsData.map((version: any) => ({
          id: version.id,
          isLatest: version.is_latest,
          label: `Version ${version.version}`,
          status: version.status,
          url: `/business-plans/${version?.agency.name}/${version.year_start}-${version.year_end}`,
          version: version.version,
        }))
      : []

  const displayStatusTag = (status: Status) => {
    const { bgColor, border = '', textColor } = statusStyles[status] || {}

    return (
      <span
        className={cx(
          'mx-2 !p-1 text-xs',
          tagClassnames,
          bgColor,
          border,
          textColor,
        )}
      >
        {status}
      </span>
    )
  }

  const requestAnotherVersion = (version: any) => {
    const shouldRequestData =
      versions.length > 1 &&
      (params.version ? params.version !== version.version : !version.isLatest)

    if (shouldRequestData) {
      setParams({ version: version.version })
    }
  }
  const fullLabel = `${business_plan?.agency.name} ${business_plan?.year_start} - ${business_plan?.year_end}`

  return isView ? (
    <div className="relative">
      <div
        className="flex cursor-pointer items-center justify-between gap-x-2"
        ref={ref}
        onClick={toggleShowVersionsMenu}
      >
        <h1 className="m-0 text-5xl leading-normal">{fullLabel}</h1>
        <IoChevronDown className="text-5xl font-bold text-gray-700" />
      </div>
      <div
        className={cx(
          'absolute left-0 z-10 max-h-[200px] origin-top overflow-y-auto rounded-none border border-solid border-primary bg-gray-A100 opacity-0 transition-all',
          {
            'collapse scale-y-0': !showVersionsMenu,
            'scale-y-100 opacity-100': showVersionsMenu,
          },
        )}
      >
        {versions.map((version: any, idx: number) => {
          return (
            <NextLink
              key={version.id}
              className="flex items-center gap-x-2 rounded-none px-2 py-2 text-black no-underline hover:bg-primary hover:text-white"
              href={version.url}
              onClick={() => requestAnotherVersion(version)}
            >
              <div className="flex w-56 items-center justify-between hover:text-white">
                <div>{version.label}</div>
                <div className="flex items-center">
                  {idx === 0 && displayStatusTag(version.status)}
                </div>
              </div>
            </NextLink>
          )
        })}
      </div>
    </div>
  ) : (
    <h1 className="m-0 text-5xl leading-normal">{fullLabel}</h1>
  )
}

const ViewHeaderActions = () => {
  const { data } = useContext(BPContext) as any
  const business_plan = data?.results?.business_plan

  const { user_type } = useStore((state) => state.user?.data)

  const isDraft = business_plan?.status === 'draft'

  return (
    <div className="flex items-center">
      {!!business_plan && (
        <div className="container flex w-full justify-between gap-x-4 px-0">
          <div className="flex justify-between gap-x-4">
            {userCanEditBusinessPlan[user_type as UserType] && (
              <>
                <Link
                  className="px-4 py-2 shadow-none"
                  color="secondary"
                  href={`/business-plans/${business_plan?.agency.name}/${business_plan?.year_start}-${business_plan?.year_end}/edit/`}
                  size="large"
                  variant="contained"
                  button
                >
                  {/* {isDraft ? 'Edit as draft' : 'Add new version'} */}
                  Edit as draft
                </Link>
                {isDraft && (
                  <Button
                    color="primary"
                    size="small"
                    variant="contained"
                    onClick={() => {}}
                  >
                    Submit final version
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

type HeaderTagProps = {
  business_plan: any
  children: React.ReactNode
}

type BusinessPlanVersionsInterface = {
  is_latest: boolean
  status: Status
  version: number
}

const HeaderTag = ({ business_plan, children }: HeaderTagProps) => {
  const { is_latest, status, version }: BusinessPlanVersionsInterface =
    business_plan || {}
  const { bgColor, border = '', textColor } = statusStyles[status] || {}

  return (
    <>
      <span
        className={cx(
          'border-transparent bg-primary text-white',
          tagClassnames,
        )}
      >
        {is_latest ? 'Latest' : `Version ${version}`}
      </span>
      <span className={cx(tagClassnames, bgColor, border, textColor)}>
        {children}
      </span>
    </>
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
  viewType,
}: {
  business_plan: ApiBP
  tag?: React.JSX.Element
  titlePrefix?: React.JSX.Element
  viewType?: string
}) => {
  const { agency, year_end, year_start } = business_plan
  const { id: agency_id } = agency || {}

  const bpVersions = useGetBPVersions({
    agency_id,
    year_end,
    year_start,
  })

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
      <div className="flex flex-wrap items-center gap-x-2">
        {titlePrefix}
        <HeaderVersionsDropdown {...{ bpVersions, viewType }} />
        {tag}
      </div>
      {viewType === 'view' && (
        <BPDiffButton {...{ bpVersions, business_plan }} />
      )}
    </div>
  )
}

const BPHeaderView = ({
  actions = <ViewHeaderActions />,
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
