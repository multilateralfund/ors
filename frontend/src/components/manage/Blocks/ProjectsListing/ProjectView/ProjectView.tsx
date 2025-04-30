'use client'

import { useState } from 'react'

import ProjectOverview from './ProjectOverview'
import ProjectDescription from './ProjectDescription'
import ProjectFinancial from './ProjectFinancial'
import ProjectDate from './ProjectDate'
import ProjectSubmissionDetails from './ProjectSubmissionDetails'
import ProjectSubstanceDetails from './ProjectSubstanceDetails'
import ProjectCostsDetails from './ProjectCostsDetails'
import ProjectPhaseOutDetails from './ProjectPhaseOutDetails'
import ProjectImpact from './ProjectImpact'
import ProjectDocumentation from '../Project/ProjectDocumentation'

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
          id="project-description"
          aria-controls="project-description"
          label="Description"
        />
        <Tab
          id="project-financial"
          aria-controls="project-financial"
          label="Financial"
        />
        <Tab id="project-date" aria-controls="project-date" label="Date" />
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
          id="project-phase-out"
          aria-controls="project-phase-out"
          label="Phase-out details"
        />
        <Tab
          id="project-impact"
          aria-controls="project-impact"
          label="Impact"
        />
        <Tab
          id="project-documentation"
          aria-controls="project-documentation"
          label="Documentation"
        />
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {activeTab === 0 && <ProjectOverview {...props} />}
        {activeTab === 1 && <ProjectDescription {...props} />}
        {activeTab === 2 && <ProjectFinancial {...props} />}
        {activeTab === 3 && <ProjectDate {...props} />}
        {activeTab === 4 && <ProjectSubmissionDetails {...props} />}
        {activeTab === 5 && <ProjectSubstanceDetails {...props} />}
        {activeTab === 6 && <ProjectCostsDetails {...props} />}
        {activeTab === 7 && <ProjectPhaseOutDetails {...props} />}
        {activeTab === 8 && <ProjectImpact {...props} />}
        {activeTab === 9 && (
          <ProjectDocumentation projectFiles={props.projectFiles} />
        )}
      </div>
    </>
  )
}

export default ProjectView
