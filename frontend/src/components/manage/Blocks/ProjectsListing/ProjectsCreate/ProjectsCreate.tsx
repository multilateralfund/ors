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
} from '../interfaces.ts'
import { getSectionFields } from '../utils.ts'

import { Tabs, Tab } from '@mui/material'

const ProjectsCreate = ({
  heading,
  actionButtons,
  project,
  specificFields,
  projIdentifiers,
  setProjIdentifiers,
  crossCuttingFields,
  setCrossCuttingFields,
  isLinkedToBP,
  setIsLinkedToBP,
  bpId,
  setBpId,
  projectSpecificFields,
  setProjectSpecificFields,
  ...rest
}: ProjectFiles & {
  heading: string
  actionButtons: ReactNode
  project?: ProjectTypeApi
  projectFiles?: ProjectFile[]
  specificFields: ProjectSpecificFields[]
  projectSpecificFields: any
  setProjectSpecificFields: any
  projIdentifiers: any
  crossCuttingFields: any
  setProjIdentifiers: any
  setCrossCuttingFields: any
  isLinkedToBP: any
  setIsLinkedToBP: any
  bpId: any
  setBpId: any
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [currentTab, setCurrentTab] = useState<number>(0)

  const { cluster } = projIdentifiers
  const { project_type, sector } = crossCuttingFields

  const canLinkToBp = !!(
    projIdentifiers.country &&
    projIdentifiers.meeting &&
    cluster &&
    ((projIdentifiers.is_lead_agency && projIdentifiers.current_agency) ||
      (!projIdentifiers.is_lead_agency && projIdentifiers.side_agency))
  )

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
            projIdentifiers,
            setProjIdentifiers,
            setCrossCuttingFields,
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
            projIdentifiers,
            isLinkedToBP,
            setIsLinkedToBP,
            bpId,
            setBpId,
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
            projIdentifiers,
            crossCuttingFields,
            setCrossCuttingFields,
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
          fields={projectSpecificFields}
          setFields={setProjectSpecificFields}
          sectionFields={overviewFields}
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
          fields={projectSpecificFields}
          setFields={setProjectSpecificFields}
          sectionFields={substanceDetailsFields}
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
          fields={projectSpecificFields}
          setFields={setProjectSpecificFields}
          sectionFields={impactFields}
        />
      ),
    },
    {
      step: 6,
      id: 'project-documentation-section',
      ariaControls: 'project-documentation-section',
      label: 'Documentation',
      disabled: areNextSectionsDisabled,
      component: <ProjectDocumentation {...rest} mode="edit" />,
    },
  ]

  return (
    <>
      <HeaderTitle>
        <div className="align-center flex justify-between">
          <PageHeading className="min-w-fit">{heading}</PageHeading>
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
