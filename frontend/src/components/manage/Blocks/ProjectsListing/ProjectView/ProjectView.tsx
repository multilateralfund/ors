'use client'

import { useState } from 'react'

import ProjectIdentifiers from './ProjectIdentifiers'
import ProjectCrossCutting from './ProjectCrossCutting'
import ProjectSpecificInfo from './ProjectSpecificInfo'
import ProjectApproval from './ProjectApproval'
import ProjectImpact from './ProjectImpact'
import ProjectDocumentation from './ProjectDocumentation'
import { useGetProjectFiles } from '../hooks/useGetProjectFiles'
import { ProjectFile, ProjectViewProps } from '../interfaces'
import { getSectionFields } from '../utils'

import { Tabs, Tab } from '@mui/material'
import { lowerCase } from 'lodash'
import ProjectHistory from '@ors/components/manage/Blocks/ProjectsListing/ProjectView/ProjectHistory.tsx'
import { IoDownloadOutline } from 'react-icons/io5'
import { formatApiUrl } from '@ors/helpers'

const ProjectView = ({ project, specificFields }: ProjectViewProps) => {
  const [activeTab, setActiveTab] = useState(0)

  const [overviewFields, substanceDetailsFields, impactFields] = [
    getSectionFields(specificFields, 'Header'),
    getSectionFields(specificFields, 'Substance Details'),
    getSectionFields(specificFields, 'Impact'),
  ]

  const projectFiles = useGetProjectFiles(project)

  return (
    <>
      <div className="flex items-center justify-between">
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
            id="project-identifiers"
            aria-controls="project-identifiers"
            label="Identifiers"
          />
          <Tab
            id="project-cross-cutting"
            aria-controls="project-cross-cutting"
            label="Cross-Cutting"
          />
          <Tab
            id="project-specific-info"
            aria-controls="project-specific-info"
            label="Specific Information"
            disabled={!substanceDetailsFields.length && !overviewFields.length}
            classes={{
              disabled: 'text-gray-200',
            }}
          />
          <Tab
            id="project-impact"
            aria-controls="project-impact"
            label="Impact"
            disabled={!impactFields.length}
            classes={{
              disabled: 'text-gray-200',
            }}
          />
          <Tab
            id="project-documentation"
            aria-controls="project-documentation"
            label="Documentation"
          />
          <Tab
            id="project-history-section"
            aria-controls="project-history-section"
            label="History"
          />
          {lowerCase(project.submission_status) === 'approved' && (
            <Tab
              id="project-approval"
              aria-controls="project-approval"
              label="Approval"
            />
          )}
        </Tabs>
        <div>
          <div className="flex items-center justify-between gap-x-2">
            <a
              className={
                'm-0 flex items-center gap-2.5 text-primary no-underline'
              }
              href={formatApiUrl(
                `/api/projects/v2/export?project_id=${project.id}`,
              )}
            >
              Download
            </a>
            <IoDownloadOutline className="text-xl text-secondary" />
          </div>
        </div>
      </div>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
        {activeTab === 0 && (
          <ProjectIdentifiers {...{ project, specificFields }} />
        )}
        {activeTab === 1 && <ProjectCrossCutting {...{ project }} />}
        {activeTab === 2 && (
          <ProjectSpecificInfo {...{ project, specificFields }} />
        )}
        {activeTab === 3 && <ProjectImpact {...{ project, specificFields }} />}
        {activeTab === 4 && (
          <ProjectDocumentation {...{ projectFiles }} mode="view" />
        )}
        {activeTab === 5 && <ProjectHistory mode={'view'} project={project} />}
        {activeTab === 6 && <ProjectApproval {...{ project }} />}
      </div>
    </>
  )
}

export default ProjectView
