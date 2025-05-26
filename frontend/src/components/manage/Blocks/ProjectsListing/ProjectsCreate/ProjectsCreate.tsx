'use client'

import { Dispatch, SetStateAction, useMemo, useState } from 'react'

import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator.tsx'
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
import {
  canGoToSecondStep,
  getProjIdentifiersErrors,
  getSectionFields,
} from '../utils.ts'

import { Tabs, Tab } from '@mui/material'
import { capitalize } from 'lodash'

const ProjectsCreate = ({
  projectData,
  setProjectData,
  specificFields,
  mode,
  project,
  files,
  errors,
  setErrors,
  projectId,
  ...rest
}: ProjectDataProps &
  ProjectFiles & {
    specificFields: ProjectSpecificFields[]
    mode: string
    errors?: { [key: string]: [] }
    setErrors?: Dispatch<SetStateAction<{ [key: string]: [] }>>
    project?: ProjectTypeApi
    projectFiles?: ProjectFile[]
    projectId: number | undefined | null
  }) => {
  const [currentStep, setCurrentStep] = useState<number>(mode !== 'add' ? 1 : 0)
  const [currentTab, setCurrentTab] = useState<number>(0)

  const projIdentifiers = projectData.projIdentifiers
  const { project_type, sector, title } = projectData.crossCuttingFields

  const canLinkToBp = canGoToSecondStep(projIdentifiers)

  const areNextSectionsDisabled = !canLinkToBp || currentStep < 1
  const areProjectSpecificTabsDisabled =
    areNextSectionsDisabled || !project_type || !sector

  const [overviewFields, substanceDetailsFields, impactFields] = [
    getSectionFields(specificFields, 'Header'),
    getSectionFields(specificFields, 'Substance Details'),
    getSectionFields(specificFields, 'Impact'),
  ]

  const projIdentifiersErrors = useMemo(
    () =>
      getProjIdentifiersErrors(
        projIdentifiers,
        errors as { [key: string]: [] },
      ),
    [projIdentifiers, errors],
  )

  const hasSectionErrors = (errors: { [key: string]: string[] }) =>
    Object.values(errors).some((errors) => errors.length > 0)

  const formatErrors = (errors: { [key: string]: string[] }) =>
    Object.entries(errors)
      .filter(([, errorMsgs]) => errorMsgs.length > 0)
      .flatMap(([field, errorMsgs]) =>
        errorMsgs.map((errMsg, idx) => ({
          id: `${field}-${idx}`,
          message: `${capitalize(field)}: ${errMsg}`,
        })),
      )

  const steps = [
    {
      step: 0,
      id: 'project-identifiers',
      ariaControls: 'project-identifiers',
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div>Identifiers</div>
          {hasSectionErrors(projIdentifiersErrors) && (
            <SectionErrorIndicator
              errors={formatErrors(projIdentifiersErrors)}
            />
          )}
        </div>
      ),
      component: (
        <ProjectIdentifiersSection
          {...{
            projectData,
            setProjectData,
            areNextSectionsDisabled,
            setCurrentStep,
            setCurrentTab,
            projectId,
          }}
          isNextBtnEnabled={canLinkToBp}
          errors={projIdentifiersErrors}
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
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div>Cross-Cutting</div>
          {!areNextSectionsDisabled &&
          (areProjectSpecificTabsDisabled || !title) ? (
            <SectionErrorIndicator errors={[]} />
          ) : null}
        </div>
      ),
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
      label: (
        <div className="relative flex items-center justify-between gap-x-2">
          <div>Documentation</div>
          {!areNextSectionsDisabled && files?.newFiles?.length === 0 ? (
            <SectionErrorIndicator errors={[]} />
          ) : null}
        </div>
      ),
      disabled: areNextSectionsDisabled,
      component: <ProjectDocumentation {...rest} {...{ files, mode }} />,
    },
  ]

  return (
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
  )
}

export default ProjectsCreate
