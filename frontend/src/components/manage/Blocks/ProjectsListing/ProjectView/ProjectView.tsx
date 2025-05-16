'use client'

import { useState } from 'react'

import ProjectOverview from './ProjectOverview'
import ProjectDescription from './ProjectDescription'
import ProjectFinancial from './ProjectFinancial'
import ProjectDate from './ProjectDate'
import ProjectSubstanceDetails from './ProjectSubstanceDetails'
import ProjectImpact from './ProjectImpact'
import ProjectDocumentation from './ProjectDocumentation'
import { ProjectViewProps } from '../interfaces'

import { Tab, Tabs } from '@mui/material'

const ProjectView = (props: ProjectViewProps) => {
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
        {activeTab === 4 && <ProjectSubstanceDetails {...props} />}
        {activeTab === 5 && <ProjectImpact {...props} />}
        {activeTab === 6 && (
          <ProjectDocumentation projectFiles={props.projectFiles} />
        )}
      </div>
    </>
  )
}

export default ProjectView
