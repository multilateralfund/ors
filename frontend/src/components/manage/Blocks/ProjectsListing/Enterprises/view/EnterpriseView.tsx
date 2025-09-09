'use client'

import { useState } from 'react'

import PEnterpriseOverviewSection from '../../ProjectsEnterprises/view/PEnterpriseOverviewSection'
import PEnterpriseRemarksSection from '../../ProjectsEnterprises/view/PEnterpriseRemarksSection'
import EnterpriseVersions from './EnterpriseVersions'
import { EnterpriseEntityType } from '../../interfaces'

import { Tabs, Tab } from '@mui/material'

const EnterpriseView = ({
  enterprise,
}: {
  enterprise: EnterpriseEntityType
}) => {
  const [activeTab, setActiveTab] = useState(0)

  const isEnterpriseApproved = enterprise.status === 'Approved'

  const tabs = [
    {
      id: 'enterprise-overview',
      ariaControls: 'enterprise-overview',
      label: 'Overview',
      component: <PEnterpriseOverviewSection {...{ enterprise }} />,
    },
    {
      id: 'enterprise-remarks',
      ariaControls: 'enterprise-remarks',
      label: 'Remarks',
      component: <PEnterpriseRemarksSection {...{ enterprise }} />,
    },
    {
      id: 'enterprise-versions',
      ariaControls: 'enterprise-versions',
      label: isEnterpriseApproved ? 'Pending versions' : 'Current version',
      component: <EnterpriseVersions {...{ enterprise }} />,
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

export default EnterpriseView
