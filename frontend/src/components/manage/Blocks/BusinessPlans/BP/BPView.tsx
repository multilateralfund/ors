'use client'
import React, { useContext, useState } from 'react'

import { Tab, Tabs } from '@mui/material'

import BPDetails from '@ors/components/manage/Blocks/BusinessPlans/BP/BPDetails'
import BusinessPlansTable from '@ors/components/manage/Blocks/Table/BusinessPlansTable/BusinessPlansTable'
import Loading from '@ors/components/theme/Loading/Loading'
import BPContext from '@ors/contexts/BusinessPlans/BPContext'
import BPProvider from '@ors/contexts/BusinessPlans/BPProvider'

import { BPHeaderView } from '../BPHeader'

function BPView() {
  // TODO: Switch from BPContext to useApi()
  const { loading } = useContext(BPContext) as any
  const [activeTab, setActiveTab] = useState(0)

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading}
      />
      <BPHeaderView />
      <div className="flex flex-wrap-reverse items-center justify-between gap-2 lg:flex-nowrap print:hidden">
        <Tabs
          className="scrollable w-96"
          aria-label="view country programme report"
          scrollButtons="auto"
          value={activeTab}
          variant="scrollable"
          TabIndicatorProps={{
            className: 'h-0',
            style: { transitionDuration: '150ms' },
          }}
          onChange={(event, newValue) => {
            setActiveTab(newValue)
          }}
          allowScrollButtonsMobile
        >
          <Tab
            id="submissions"
            className="rounded-b-none px-3 py-2"
            aria-controls="activities"
            label="Activities"
            classes={{
              selected:
                'bg-primary text-mlfs-hlYellow px-3 py-2 rounded-b-none',
            }}
          />
          <Tab
            id="submissions-log"
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
        {activeTab === 0 && <BusinessPlansTable />}
        {activeTab === 1 && <BPDetails />}
      </div>
    </>
  )
}

export default function BPViewWrapper() {
  return (
    <BPProvider>
      <BPView />
    </BPProvider>
  )
}
