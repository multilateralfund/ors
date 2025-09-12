'use client'

import { useState } from 'react'

import PEnterpriseOverviewSection from './PEnterpriseOverviewSection'
import PEnterprisesSubstanceDetailsSection from './PEnterprisesSubstanceDetailsSection'
import PEnterpriseFundingDetailsSection from './PEnterpriseFundingDetailsSection'
import { PEnterpriseType } from '../../interfaces'

import { Tabs, Tab } from '@mui/material'

const PEnterpriseView = ({ enterprise }: { enterprise: PEnterpriseType }) => {
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    {
      id: 'enterprise-overview',
      ariaControls: 'enterprise-overview',
      label: 'Overview',
      component: (
        <PEnterpriseOverviewSection
          type="project-enterprise"
          enterprise={enterprise.enterprise}
        />
      ),
    },
    {
      id: 'enterprise-substance-details',
      ariaControls: 'enterprise-substance-details',
      label: 'Substance details',
      component: <PEnterprisesSubstanceDetailsSection {...{ enterprise }} />,
    },
    {
      id: 'enterprise-funding-details',
      ariaControls: 'enterprise-funding-details',
      label: 'Funding details',
      component: <PEnterpriseFundingDetailsSection {...{ enterprise }} />,
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <Tabs
          aria-label="view-enterprise"
          value={activeTab}
          className="sectionsTabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          TabIndicatorProps={{
            className: 'h-0',
            style: { transitionDuration: '150ms' },
          }}
          onChange={(_, newValue) => {
            setActiveTab(newValue)
          }}
        >
          {tabs.map(({ id, ariaControls, label }) => (
            <Tab id={id} aria-controls={ariaControls} label={label} />
          ))}
        </Tabs>
      </div>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {tabs
          .filter((_, index) => index === activeTab)
          .map(({ component }) => component)}
      </div>
    </>
  )
}

export default PEnterpriseView
