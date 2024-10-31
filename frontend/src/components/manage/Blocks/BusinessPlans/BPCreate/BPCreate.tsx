'use client'

import { ApiEditBPActivity } from '@ors/types/api_bp_get'

import React, { PropsWithChildren } from 'react'

import { Button, Tab, Tabs } from '@mui/material'

import BPCreateProvider, {
  useBPCreate,
  useBPCreateDispatch,
} from '@ors/components/manage/Blocks/BusinessPlans/BPCreate/Provider/BPCreateProvider'
import { ActionType } from '@ors/components/manage/Blocks/BusinessPlans/BPCreate/Provider/actions'
import { BPEditBaseTable } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/BPEditTable'
import { FilesViewer } from '@ors/components/manage/Blocks/Section/ReportInfo/FilesViewer'
import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import Link from '@ors/components/ui/Link/Link'
import VersionHistoryList from '@ors/components/ui/VersionDetails/VersionHistoryList'
import { useStore } from '@ors/store'

import useGetBpPeriods from '../BPList/useGetBPPeriods'
import { RedirectToBpList } from '../RedirectToBpList'
import { useGetYearRanges } from '../useGetYearRanges'

function BPCreateHeader(props: PropsWithChildren) {
  return (
    <div className="mb-4 flex min-h-[40px] flex-wrap items-center justify-between gap-x-8 gap-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-2">
          <h1 className="m-0 text-5xl leading-normal">{props.children}</h1>
        </div>
      </div>
      <div className="ml-auto">
        <div className="flex items-center">
          <div className="container flex w-full justify-between gap-x-4 px-0">
            <Link
              className="border border-solid border-primary bg-white px-4 py-2 text-primary
                shadow-none hover:bg-primary hover:text-white"
              color="primary"
              href={`/business-plans/`}
              size="large"
              variant="contained"
              button
            >
              Cancel
            </Link>
            <Button
              className="px-4 py-2 shadow-none hover:text-white"
              size="large"
              variant="contained"
              onClick={() => false}
            >
              Save draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BPCreateContentDetails() {
  return (
    <section className="grid items-start gap-6 md:auto-rows-auto md:grid-cols-2">
      <div className="flex flex-col gap-6 rounded-lg bg-gray-100 p-4">
        <p className="m-0 text-2xl font-normal">Summary</p>
        <div className="grid w-full gap-4 md:grid-cols-2 md:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2">
          {/*<SimpleField*/}
          {/*  id="username"*/}
          {/*  className="col-span-2 lg:col-span-1"*/}
          {/*  data={'Username'}*/}
          {/*  label="Username"*/}
          {/*/>*/}
          <SimpleField
            id="name_reporting_officer"
            data={'Name'}
            label="Name of reporting officer"
          />
          {/*<SimpleField*/}
          {/*  id="email_reporting_officer"*/}
          {/*  data={'Email'}*/}
          {/*  label="Email of reporting officer"*/}
          {/*/>*/}
          <SimpleField id="agency" data={'UNEP'} label="Agency" />
          <SimpleField id="year" data={'2024'} label="Year" />
        </div>

        <FilesViewer files={[]} heading={'File attachments'} isEdit={false} />
      </div>

      <div className="flex flex-col rounded-lg bg-gray-100 p-4">
        <VersionHistoryList
          currentDataVersion={1}
          historyList={[]}
          length={3}
          type="bp"
        />
      </div>
    </section>
  )
}

function BPCreateContentActivities() {
  const ctx = useBPCreate()
  const dispatch = useBPCreateDispatch()
  return (
    <BPEditBaseTable
      form={ctx.form}
      loading={false}
      params={[]}
      setForm={(form) =>
        dispatch({
          payload: form as ApiEditBPActivity[],
          type: ActionType.addActivity,
        })
      }
      yearRangeSelected={{
        max_year: 2024 + 2,
        min_year: 2024,
        year_end: 2024 + 2,
        year_start: 2024,
      }}
    />
  )
}

function BPCreate() {
  const { results: yearRanges } = useGetYearRanges()
  const { periodOptions } = useGetBpPeriods(yearRanges)
  const { bpFilters } = useStore((state) => state.bpFilters)

  const currentYearRange = bpFilters.range
    ? bpFilters.range
    : periodOptions?.[0]?.value

  const ctx = useBPCreate()
  const dispatch = useBPCreateDispatch()

  return (
    <>
      <div>
        <RedirectToBpList {...{ currentYearRange }} />
        <BPCreateHeader>New business plan</BPCreateHeader>
      </div>
      <div className="flex items-center justify-between gap-2 lg:flex-nowrap print:hidden">
        <Tabs
          className="scrollable w-96"
          aria-label="view country programme report"
          scrollButtons="auto"
          value={ctx.activeTab}
          variant="scrollable"
          TabIndicatorProps={{
            className: 'h-0',
            style: { transitionDuration: '150ms' },
          }}
          onChange={(_, newValue) => {
            dispatch({ payload: newValue, type: ActionType.setActiveTab })
          }}
          allowScrollButtonsMobile
        >
          <Tab
            id="activities"
            className="rounded-b-none px-3 py-2"
            aria-controls="activities"
            label="Activities"
            classes={{
              selected:
                'bg-primary text-mlfs-hlYellow px-3 py-2 rounded-b-none',
            }}
          />
          <Tab
            id="details"
            className="rounded-b-none px-3 py-2"
            aria-controls="business-plan-details"
            label="Details"
            classes={{
              selected:
                'bg-primary text-mlfs-hlYellow px-3 py-2 rounded-b-none',
            }}
          />
        </Tabs>
      </div>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary bg-white p-6">
        {ctx.activeTab === 0 ? <BPCreateContentActivities /> : null}
        {ctx.activeTab === 1 ? <BPCreateContentDetails /> : null}
      </div>
    </>
  )
}

export default function BPCreateWrapper() {
  return (
    <BPCreateProvider>
      <BPCreate />
    </BPCreateProvider>
  )
}
