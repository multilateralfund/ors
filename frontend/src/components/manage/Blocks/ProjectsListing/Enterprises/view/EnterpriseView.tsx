import { useContext, useState } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import EnterpriseOverviewSection from '../viewTabs/EnterpriseOverviewSection'
import EnterpriseDetailsSection from '../viewTabs/EnterpriseDetailsSection'
import EnterpriseSubstanceDetailsSection from '../viewTabs/EnterpriseSubstanceDetailsSection'
import EnterpriseFundingDetailsSection from '../viewTabs/EnterpriseFundingDetailsSection'
import EnterpriseRemarksSection from '../viewTabs/EnterpriseRemarksSection'
import EnterpriseDelete from './EnterpriseDelete'
import { EnterpriseType } from '../../interfaces'

import { Tabs, Tab } from '@mui/material'

const EnterpriseView = ({ enterprise }: { enterprise: EnterpriseType }) => {
  const { canEditEnterprise } = useContext(PermissionsContext)

  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    {
      id: 'enterprise-overview',
      label: 'Overview',
      component: <EnterpriseOverviewSection {...{ enterprise }} />,
    },
    {
      id: 'enterprise-details',
      label: 'Details',
      component: <EnterpriseDetailsSection {...{ enterprise }} />,
    },
    {
      id: 'enterprise-substance-details',
      label: 'Substance details',
      component: <EnterpriseSubstanceDetailsSection {...{ enterprise }} />,
    },
    {
      id: 'enterprise-funding-details',
      label: 'Funding details',
      component: <EnterpriseFundingDetailsSection {...{ enterprise }} />,
    },
    {
      id: 'enterprise-remarks',
      label: 'Remarks',
      component: <EnterpriseRemarksSection {...{ enterprise }} />,
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
            <Tab key={id} id={id} aria-controls={id} label={label} />
          ))}
        </Tabs>
        {canEditEnterprise && <EnterpriseDelete {...{ enterprise }} />}
      </div>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {tabs
          .filter((_, index) => index === activeTab)
          .map(({ id, component }) => (
            <span key={id}>{component}</span>
          ))}
      </div>
    </>
  )
}

export default EnterpriseView
