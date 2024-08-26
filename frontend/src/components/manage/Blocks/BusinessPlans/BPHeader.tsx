'use client'

import React, { useContext, useState } from 'react'

import { Button } from '@mui/material'
import cx from 'classnames'
import NextLink from 'next/link'

import Link from '@ors/components/ui/Link/Link'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'
import useClickOutside from '@ors/hooks/useClickOutside'

import { useGetBPVersions } from './BP/useGetBPVersions'

import { IoChevronDown } from 'react-icons/io5'

const HeaderVersionsDropdown = () => {
  const [showVersionsMenu, setShowVersionsMenu] = useState(false)
  const { data, loading } = useContext(BPContext) as any
  const business_plan = data?.results?.business_plan || {}
  const toggleShowVersionsMenu = () => setShowVersionsMenu((prev) => !prev)

  const bpVersions = useGetBPVersions(business_plan)

  const ref = useClickOutside(() => {
    setShowVersionsMenu(false)
  })

  const { loading: versionsLoading, results: versionsData = [] } = bpVersions
  const versionsReady = business_plan || (!versionsLoading && !loading)

  const versions =
    versionsReady && versionsData.length > 0
      ? versionsData.map((version: any) => ({
          id: version.id,
          // isDraft: version.status === 'draft',
          label: `Version ${version.version}`,
          // isFinal: version.status === 'final',
          status: version.status,
          url: `/business-plans/${version?.agency.name}/${version.year_start}-${version.year_end}`,
        }))
      : []

  // const tagLatest = (
  //   <span className="mx-2 rounded-md bg-gray-400 p-1 text-xs text-white">
  //     LATEST
  //   </span>
  // )
  // const tagDraft = (
  //   <span className="mx-2 rounded-md bg-warning p-1 text-xs text-white">
  //     Draft
  //   </span>
  // )
  const displayStatusTag = (status: string) => (
    <span className="mx-2 rounded-md bg-warning p-1 text-xs uppercase text-white">
      {status}
    </span>
  )

  const fullLabel = `${business_plan?.agency.name} ${business_plan?.year_start} - ${business_plan?.year_end}`

  return (
    <div className="relative">
      {versions.length > 1 ? (
        <>
          <div
            className="flex cursor-pointer items-center justify-between gap-x-2"
            ref={ref}
            onClick={versions.length > 1 ? toggleShowVersionsMenu : undefined}
          >
            <h1 className="m-0 text-5xl leading-normal">{fullLabel}</h1>
            {versions.length > 1 && (
              <IoChevronDown className="text-5xl font-bold text-gray-700" />
            )}
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
            {versions.map((version: any, idx: number) => (
              <NextLink
                key={version.id}
                className="flex items-center gap-x-2 rounded-none px-2 py-2 text-black no-underline hover:bg-primary hover:text-white"
                href={version.url}
              >
                <div className="flex w-56 items-center justify-between hover:text-white">
                  <div>{version.label}</div>
                  <div className="flex items-center">
                    {/* {idx == 0 && (version.isFinal ? tagLatest : tagDraft)}
                    {idx == 1 && versions[0].isDraft && tagLatest} */}
                    {idx === 0 && displayStatusTag(version.status)}
                  </div>
                </div>
              </NextLink>
            ))}
          </div>
        </>
      ) : (
        <div className="flex cursor-pointer items-center justify-between gap-x-2">
          <h1 className="m-0 text-5xl leading-normal">{fullLabel}</h1>
        </div>
      )}
    </div>
  )
}

const ViewHeaderActions = () => {
  const { data } = useContext(BPContext) as any
  const business_plan = data?.results?.business_plan

  const isDraft = business_plan?.status === 'draft'

  return (
    <div className="flex items-center">
      {!!business_plan && (
        <div className="container flex w-full justify-between gap-x-4 px-0">
          <div className="flex justify-between gap-x-4">
            <Link
              className="px-4 py-2 shadow-none"
              color="secondary"
              href={`/business-plans/${business_plan?.agency.name}/${business_plan?.year_start}-${business_plan?.year_end}/edit/`}
              size="large"
              variant="contained"
              button
            >
              {isDraft ? 'Edit report' : 'Add new version'}
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
            <Link
              className="btn-close bg-gray-600 px-4 py-2 shadow-none"
              color="secondary"
              href={`/business-plans`}
              size="large"
              variant="contained"
              button
            >
              View Business Plans
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

type HeaderTagProps = {
  children: React.ReactNode
  status: any
}

const HeaderTag = ({ children, status }: HeaderTagProps) => {
  return (
    <span
      className={cx(
        'self-baseline rounded p-1 font-medium uppercase leading-none',
        {
          'bg-mlfs-hlYellow': status === 'Approved',
          'bg-primary text-mlfs-hlYellow': status === 'Submitted',
          'bg-warning': status === 'Rejected',
        },
      )}
    >
      {children}
    </span>
  )
}

const ViewHeaderTag = () => {
  const { data } = useContext(BPContext) as any
  const business_plan = data?.results?.business_plan

  const { status } = business_plan || {}

  return <HeaderTag status={status}>{status}</HeaderTag>
}

const BPHeader = ({
  actions = <ViewHeaderActions />,
  tag = <ViewHeaderTag />,
  titlePrefix,
}: {
  actions?: React.JSX.Element
  tag?: React.JSX.Element
  titlePrefix?: React.JSX.Element
}) => {
  const contextBP = useContext(BPContext) as any

  return (
    !!contextBP.data && (
      <div>
        <div className="mb-2 font-[500] uppercase">Business Plans</div>
        <div className="mb-4 flex min-h-[40px] flex-wrap items-center justify-between gap-x-8 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-2">
            <div className="flex items-center gap-x-2">
              {titlePrefix}
              <HeaderVersionsDropdown />
              {tag}
            </div>
          </div>
          <div className="ml-auto">{actions}</div>
        </div>
      </div>
    )
  )
}

const BPHeaderView = () => {
  return <BPHeader />
}

export { BPHeaderView }
