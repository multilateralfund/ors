'use client'

import { useState } from 'react'

import PEnterpriseOverviewSection from './PEnterpriseOverviewSection'
import PEnterpriseDetailsSection from './PEnterpriseDetailsSection'
import PEnterpriseSubstanceDetailsSection from './PEnterpriseSubstanceDetailsSection'
import PEnterpriseFundingDetailsSection from './PEnterpriseFundingDetailsSection'
import PEnterpriseRemarksSection from './PEnterpriseRemarksSection'
import { PEnterpriseType } from '../../interfaces'

import { Tabs, Tab } from '@mui/material'

const PEnterpriseView = ({ enterprise }: { enterprise: PEnterpriseType }) => {
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    {
      id: 'enterprise-overview',
      label: 'Overview',
      component: (
        <PEnterpriseOverviewSection enterprise={enterprise.enterprise} />
      ),
    },
    {
      id: 'enterprise-details',
      label: 'Details',
      component: <PEnterpriseDetailsSection {...{ enterprise }} />,
    },
    {
      id: 'enterprise-substance-details',
      label: 'Substance details',
      component: <PEnterpriseSubstanceDetailsSection {...{ enterprise }} />,
    },
    {
      id: 'enterprise-funding-details',
      label: 'Funding details',
      component: <PEnterpriseFundingDetailsSection {...{ enterprise }} />,
    },
    {
      id: 'enterprise-remarks',
      label: 'Remarks',
      component: <PEnterpriseRemarksSection {...{ enterprise }} />,
    },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <Tabs
          aria-label="view-project-enterprise"
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
          {tabs.map(({ id, label }) => (
            <Tab id={id} aria-controls={id} label={label} />
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
