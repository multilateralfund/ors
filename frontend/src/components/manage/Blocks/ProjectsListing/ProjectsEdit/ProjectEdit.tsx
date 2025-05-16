'use client'

import { useState } from 'react'

import ProjectOverview from '../ProjectView/ProjectOverview'
import ProjectDescription from '../ProjectView/ProjectDescription'
import ProjectFinancial from '../ProjectView/ProjectFinancial'
import ProjectDate from '../ProjectView/ProjectDate'
import ProjectSubstanceDetails from '../ProjectView/ProjectSubstanceDetails'
import ProjectImpact from '../ProjectView/ProjectImpact'
import ProjectDocumentation from '../ProjectView/ProjectDocumentation'

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
        {/* {activeTab === 0 && <ProjectOverview {...{ project }} />}
        {activeTab === 1 && <ProjectDescription {...props} />}
        {activeTab === 2 && <ProjectFinancial {...{ project }} />}
        {activeTab === 3 && <ProjectDate {...{ project }} />}
        {activeTab === 4 && <ProjectSubstanceDetails {...{ project }} />}
        {activeTab === 5 && <ProjectImpact {...{ project }} />}
        {activeTab === 6 && <ProjectDocumentation mode="edit" {...rest} />} */}
      </div>
    </>
  )
}

export default ProjectEdit
