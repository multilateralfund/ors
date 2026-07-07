import { useState } from 'react'

import PCRResultsAssessment from './PCRResultsAssessment'

import { Tabs, Tab } from '@mui/material'

const PCRForm = () => {
  const [currentTab, setCurrentTab] = useState<number>(0)

  const TabLabel = ({ title }: { title: string }) => (
    <div className="relative flex items-center justify-between gap-x-2">
      <div className="leading-tight">{title}</div>
    </div>
  )

  const tabs = [
    {
      id: 'pcr-overview',
      label: <TabLabel title="Overview" />,
      component: <>Overview</>,
    },
    {
      id: 'pcr-summary-of-key-data',
      label: <TabLabel title="Summary of key data (tranches)" />,
      component: <>Summary of key data (tranches)</>,
    },
    {
      id: 'pcr-results-assessment',
      label: <TabLabel title="Project results overall assessment" />,
      component: <PCRResultsAssessment {...{ setCurrentTab }} />,
    },
    {
      id: 'pcr-causes-of-delay',
      label: <TabLabel title="Causes of delay" />,
      component: <>Causes of delay</>,
    },
    {
      id: 'pcr-lessons-learned',
      label: <TabLabel title="Lessons learned" />,
      component: <>Lessons learned</>,
    },
    {
      id: 'pcr-gender-mainstreaming',
      label: <TabLabel title="Gender mainstreaming" />,
      component: <>Gender mainstreaming</>,
    },
    {
      id: 'pcr-sdgs',
      label: <TabLabel title="SDGs (optional)" />,
      component: <>SDGs (optional)</>,
    },
    {
      id: 'pcr-supporting-evidence',
      label: <TabLabel title="Other supporting evidence" />,
      component: <>Other supporting evidence</>,
    },
  ]

  return (
    <>
      <Tabs
        aria-label="pcr-form"
        className="sectionsTabs"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        TabIndicatorProps={{
          className: 'h-0',
          style: { transitionDuration: '150ms' },
        }}
        value={currentTab}
        onChange={(_, newValue) => {
          setCurrentTab(newValue)
        }}
      >
        {tabs.map(({ id, label }) => (
          <Tab key={id} aria-controls={id} {...{ id, label }} />
        ))}
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {tabs
          .filter((_, index) => index === currentTab)
          .map(({ id, component }) => (
            <span key={id}>{component}</span>
          ))}
      </div>
    </>
  )
}

export default PCRForm
