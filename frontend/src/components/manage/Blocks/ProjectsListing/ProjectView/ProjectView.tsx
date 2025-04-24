'use client'

import { useState } from 'react'

import ProjectOverview from './ProjectOverview'
import ProjectFundingDetails from './ProjectFundingDetails'
import ProjectPhaseOutDetails from './ProjectPhaseOutDetails'
import ProjectImpact from './ProjectImpact'

import { Tab, Tabs } from '@mui/material'

const ProjectView = (props: any) => {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <>
      <Tabs
        aria-label="view-project"
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
        <Tab
          id="project-overview"
          aria-controls="project-overview"
          label="Overview"
        />
        <Tab
          id="project-funding"
          aria-controls="project-funding"
          label="Funding details"
        />
        <Tab
          id="project-phase-out"
          aria-controls="project-phase-out"
          label="Phase-out details"
        />
        <Tab
          id="project-impact"
          aria-controls="project-impact"
          label="Impact"
        />
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {activeTab === 0 && <ProjectOverview {...props} />}
        {activeTab === 1 && <ProjectFundingDetails {...props} />}
        {activeTab === 2 && <ProjectPhaseOutDetails {...props} />}
        {activeTab === 3 && <ProjectImpact {...props} />}
      </div>
    </>
  )
}

export default ProjectView
