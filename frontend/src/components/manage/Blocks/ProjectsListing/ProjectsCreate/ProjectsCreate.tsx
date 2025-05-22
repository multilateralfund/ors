'use client'

import { ReactNode, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ProjectIdentifiersSection from './ProjectIdentifiersSection.tsx'
import ProjectBPLinking from './ProjectBPLinking'
import ProjectCrossCuttingFields from './ProjectCrossCuttingFields'
import ProjectOverview from './ProjectOverview.tsx'
import ProjectSubstanceDetails from './ProjectSubstanceDetails.tsx'
import ProjectImpact from './ProjectImpact.tsx'
import ProjectDocumentation from '../ProjectView/ProjectDocumentation.tsx'
import {
  ProjectFile,
  ProjectSpecificFields,
  ProjectTypeApi,
  ProjectFiles,
  ProjectDataProps,
} from '../interfaces.ts'
import { canGoToSecondStep, getSectionFields } from '../utils.ts'

import { Tabs, Tab } from '@mui/material'

const ProjectsCreate = ({
  projectData,
  setProjectData,
  heading,
  actionButtons,
  specificFields,
  mode,
  project,
  versions,
  ...rest
}: ProjectDataProps &
  ProjectFiles & {
    heading: string
    actionButtons: ReactNode
    specificFields: ProjectSpecificFields[]
    mode: string
    project?: ProjectTypeApi
    projectFiles?: ProjectFile[]
    versions?: ReactNode
  }) => {
  const [currentStep, setCurrentStep] = useState<number>(
    mode === 'edit' ? 1 : 0,
  )
  const [currentTab, setCurrentTab] = useState<number>(0)

  const projIdentifiers = projectData.projIdentifiers
  const { project_type, sector } = projectData.crossCuttingFields

  const canLinkToBp = canGoToSecondStep(projIdentifiers)

  const areNextSectionsDisabled = !canLinkToBp || currentStep < 1
  const areProjectSpecificTabsDisabled =
    areNextSectionsDisabled || !project_type || !sector

  const [overviewFields, substanceDetailsFields, impactFields] = [
    getSectionFields(specificFields, 'Header'),
    getSectionFields(specificFields, 'Substance Details'),
    getSectionFields(specificFields, 'Impact'),
  ]

  const steps = [
    {
      step: 0,
      id: 'project-identifiers',
      ariaControls: 'project-identifiers',
      label: 'Identifiers',
      component: (
        <ProjectIdentifiersSection
          {...{
            projectData,
            setProjectData,
            areNextSectionsDisabled,
            setCurrentStep,
            setCurrentTab,
          }}
          isNextBtnEnabled={canLinkToBp}
        />
      ),
    },
    {
      step: 1,
      id: 'project-bp-link-section',
      ariaControls: 'project-bp-link-section',
      label: 'Business Plan',
      disabled: areNextSectionsDisabled,
      component: (
        <ProjectBPLinking
          {...{
            projectData,
            setProjectData,
          }}
        />
      ),
    },
    {
      step: 2,
      id: 'project-cross-cutting-section',
      ariaControls: 'project-cross-cutting-section',
      label: 'Cross-Cutting',
      disabled: areNextSectionsDisabled,
      component: (
        <ProjectCrossCuttingFields
          {...{
            projectData,
            setProjectData,
          }}
        />
      ),
    },
    {
      step: 3,
      id: 'project-specific-overview-section',
      ariaControls: 'project-specific-overview-section',
      label: 'Overview',
      disabled: areProjectSpecificTabsDisabled || overviewFields.length < 1,
      component: (
        <ProjectOverview
          sectionFields={overviewFields}
          {...{ projectData, setProjectData }}
        />
      ),
    },
    {
      step: 4,
      id: 'project-substance-details-section',
      ariaControls: 'project-substance-details-section',
      label: 'Substance details',
      disabled:
        areProjectSpecificTabsDisabled || substanceDetailsFields.length < 1,
      component: (
        <ProjectSubstanceDetails
          sectionFields={substanceDetailsFields}
          {...{ projectData, setProjectData }}
        />
      ),
    },
    {
      step: 5,
      id: 'project-impact-section',
      ariaControls: 'project-impact-section',
      label: 'Impact',
      disabled: areProjectSpecificTabsDisabled || impactFields.length < 1,
      component: (
        <ProjectImpact
          sectionFields={impactFields}
          {...{ projectData, setProjectData }}
        />
      ),
    },
    {
      step: 6,
      id: 'project-documentation-section',
      ariaControls: 'project-documentation-section',
      label: 'Documentation',
      disabled: areNextSectionsDisabled,
      component: <ProjectDocumentation {...rest} mode={mode} />,
    },
  ]

  return (
    <>
      <HeaderTitle>
        <div className="align-center flex flex-wrap justify-between gap-x-4 gap-y-2">
          <div className="flex gap-2">
            <PageHeading>{heading}</PageHeading>
            {versions}
          </div>
          {actionButtons}
        </div>
      </HeaderTitle>

      <>
        <Tabs
          aria-label="create-project"
          value={currentTab}
          className="sectionsTabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          TabIndicatorProps={{
            className: 'h-0',
            style: { transitionDuration: '150ms' },
          }}
          onChange={(_, newValue) => {
            setCurrentTab(newValue)
          }}
        >
          {steps.map(({ id, ariaControls, label, disabled }) => (
            <Tab
              id={id}
              aria-controls={ariaControls}
              label={label}
              disabled={disabled}
              classes={{
                disabled: 'text-gray-200',
              }}
            />
          ))}
        </Tabs>
        <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary p-6">
          {steps
            .filter(({ step }) => step === currentTab)
            .map(({ component }) => component)}
        </div>
      </>
    </>
  )
}

export default ProjectsCreate
