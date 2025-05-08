'use client'

import { useState } from 'react'

import ProjectOverview from '../ProjectView/ProjectOverview'
import ProjectDescription from '../ProjectView/ProjectDescription'
import ProjectFinancial from '../ProjectView/ProjectFinancial'
import ProjectDate from '../ProjectView/ProjectDate'
import ProjectSubmissionDetails from '../ProjectView/ProjectSubmissionDetails'
import ProjectSubstanceDetails from '../ProjectView/ProjectSubstanceDetails'
import ProjectCostsDetails from '../ProjectView/ProjectCostsDetails'
import ProjectPhaseOutDetails from '../ProjectView/ProjectPhaseOutDetails'
import ProjectImpact from '../ProjectView/ProjectImpact'
import ProjectDocumentation from '../Project/ProjectDocumentation'

import { Tab, Tabs } from '@mui/material'

const ProjectEdit = (props: any) => {
  const { project, ...rest } = props

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
          id="project-substance-details"
          aria-controls="project-substance-details"
          label="Substance details"
        />
        <Tab
          id="project-submission"
          aria-controls="project-submission"
          label="Submission details"
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
        <Tab
          id="project-documentation"
          aria-controls="project-documentation"
          label="Documentation"
        />
      </Tabs>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {activeTab === 0 && <ProjectOverview {...{ project }} />}
        {activeTab === 1 && <ProjectDescription {...props} />}
        {activeTab === 2 && <ProjectFinancial {...{ project }} />}
        {activeTab === 3 && <ProjectDate {...{ project }} />}
        {activeTab === 4 && <ProjectSubstanceDetails {...{ project }} />}
        {activeTab === 5 && <ProjectSubmissionDetails {...{ project }} />}
        {activeTab === 6 && <ProjectCostsDetails {...{ project }} />}
        {activeTab === 7 && <ProjectPhaseOutDetails {...{ project }} />}
        {activeTab === 8 && <ProjectImpact {...{ project }} />}
        {activeTab === 9 && <ProjectDocumentation mode="edit" {...rest} />}
      </div>
    </>
  )
}

export default ProjectEdit
