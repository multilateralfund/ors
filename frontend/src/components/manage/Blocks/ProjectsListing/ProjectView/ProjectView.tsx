'use client'

import { useState } from 'react'

import ProjectOverview from './ProjectOverview'
import ProjectSubmissionDetails from './ProjectSubmissionDetails'
import ProjectSubstanceDetails from './ProjectSubstanceDetails'
import ProjectCostsDetails from './ProjectCostsDetails'
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
          id="project-submission"
          aria-controls="project-submission"
          label="Submission details"
        />
        <Tab
          id="project-substance-details"
          aria-controls="project-substance-details"
          label="Substance details"
        />
        <Tab
          id="project-costs"
          aria-controls="project-costs"
          label="Costs details"
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
        {activeTab === 1 && <ProjectSubmissionDetails {...props} />}
        {activeTab === 2 && <ProjectSubstanceDetails {...props} />}
        {activeTab === 3 && <ProjectCostsDetails {...props} />}
        {activeTab === 4 && <ProjectFundingDetails {...props} />}
        {activeTab === 5 && <ProjectPhaseOutDetails {...props} />}
        {activeTab === 6 && <ProjectImpact {...props} />}
      </div>
    </>
  )
}

export default ProjectView
