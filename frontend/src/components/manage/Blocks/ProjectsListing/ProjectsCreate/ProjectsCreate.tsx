'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Link from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ProjectIdentifiersSection from './ProjectIdentifiersSection.tsx'
import ProjectBPLinking from './ProjectBPLinking'
import ProjectCrossCuttingFields from './ProjectCrossCuttingFields'
import ProjectOverview from './ProjectOverview.tsx'
import ProjectSubstanceDetails from './ProjectSubstanceDetails.tsx'
import ProjectImpact from './ProjectImpact.tsx'
import ProjectDocumentation from '../ProjectView/ProjectDocumentation.tsx'
import { fetchSpecificFields } from '../hooks/getSpecificFields.ts'
import {
  CrossCuttingFields,
  ProjIdentifiers,
  ProjectFile,
  ProjectSpecificFields,
  ProjectTypeApi,
  ProjectFiles,
  SpecificFields,
  OdsOdpFields,
} from '../interfaces.ts'
import {
  initialCrossCuttingFields,
  initialProjectIdentifiers,
} from '../constants.ts'
import { getDefaultValues, getSectionFields } from '../utils.ts'
import { api } from '@ors/helpers'

import { Alert, Button, CircularProgress, Tabs, Tab } from '@mui/material'
import { groupBy, isNil, map, omit, pickBy } from 'lodash'
import cx from 'classnames'

const ProjectsCreate = ({
  heading,
  actionButtons,
  project,
  ...rest
}: ProjectFiles & {
  heading: string
  actionButtons?: ReactNode
  project?: ProjectTypeApi
  projectFiles?: ProjectFile[]
}) => {
  const [specificFields, setSpecificFields] = useState<ProjectSpecificFields[]>(
    [],
  )

  const groupedFields = groupBy(specificFields, 'table')
  const projectFields = groupedFields['project'] || []
  const odsOdpFields = groupedFields['ods_odp'] || []

  const initialProjectSpecificFields = {
    ...getDefaultValues<ProjectTypeApi>(projectFields),
    ods_odp: [],
  }

  const [currentStep, setCurrentStep] = useState<number>(0)
  const [currentTab, setCurrentTab] = useState<number>(0)
  const [projIdentifiers, setProjIdentifiers] = useState<ProjIdentifiers>(
    initialProjectIdentifiers,
  )
  const [isLinkedToBP, setIsLinkedToBP] = useState<boolean>(false)
  const [bpId, setBpId] = useState<number | null>(null)
  const [crossCuttingFields, setCrossCuttingFields] =
    useState<CrossCuttingFields>(initialCrossCuttingFields)
  const [projectSpecificFields, setProjectSpecificFields] =
    useState<SpecificFields>(initialProjectSpecificFields)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState<boolean>()
  const [projectId, setProjectId] = useState<number | null>(null)

  const fieldsValuesLoaded = useRef<boolean>(false)

  const cluster = projIdentifiers.cluster
  const projectType = crossCuttingFields.project_type
  const sector = crossCuttingFields.sector

  const [overviewFields, substanceDetailsFields, impactFields] = [
    getSectionFields(specificFields, 'Header'),
    getSectionFields(specificFields, 'Substance Details'),
    getSectionFields(specificFields, 'Impact'),
  ]

  useEffect(() => {
    if (cluster && projectType && sector) {
      fetchSpecificFields(cluster, projectType, sector, setSpecificFields)
    } else setSpecificFields([])
  }, [cluster, projectType, sector])

  useEffect(() => {
    if (project) {
      setProjIdentifiers({
        is_lead_agency: project.agency_id === project.lead_agency_id,
        country: project.country_id,
        meeting: project.meeting,
        current_agency: project.agency_id,
        side_agency:
          project.agency_id === project.lead_agency_id
            ? null
            : project.lead_agency_id,
        cluster: project.cluster_id,
      })
      setIsLinkedToBP(!!project.bp_activity)
      setBpId(project.bp_activity)
      setCrossCuttingFields({
        project_type: project.project_type_id,
        sector: project.sector_id,
        subsector_ids: map(project.subsectors, 'id'),
        is_lvc: project.is_lvc,
        title: project.title,
        description: project.description,
        project_start_date: project.project_start_date,
        project_end_date: project.project_end_date,
        total_fund: project.total_fund,
        support_cost_psc: project.support_cost_psc,
        individual_consideration: project.individual_consideration,
      })
    }
  }, [])

  useEffect(() => {
    if (project && specificFields.length > 0 && !fieldsValuesLoaded.current) {
      setProjectSpecificFields({
        ...getDefaultValues<ProjectTypeApi>(projectFields, project),
        ods_odp: map(project.ods_odp, (ods) => {
          return { ...getDefaultValues<OdsOdpFields>(odsOdpFields, ods) }
        }),
      })
      fieldsValuesLoaded.current = true
    }
  }, [fieldsValuesLoaded, specificFields])

  const canLinkToBp = !!(
    projIdentifiers.country &&
    projIdentifiers.meeting &&
    cluster &&
    ((projIdentifiers.is_lead_agency && projIdentifiers.current_agency) ||
      (!projIdentifiers.is_lead_agency && projIdentifiers.side_agency))
  )

  const areNextSectionsDisabled = !canLinkToBp || currentStep < 1
  const isSubmitDisabled =
    areNextSectionsDisabled ||
    !(projectType && sector && crossCuttingFields.title)
  const areProjectSpecificTabsDisabled =
    areNextSectionsDisabled || !projectType || !sector

  const steps = [
    {
      step: 0,
      id: 'project-identifiers',
      ariaControls: 'project-identifiers',
      label: 'Identifiers',
      component: (
        <ProjectIdentifiersSection
          {...{
            setCurrentStep,
            setCurrentTab,
            projIdentifiers,
            setProjIdentifiers,
            setCrossCuttingFields,
            areNextSectionsDisabled,
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
      ...(project && {
        step: 6,
        id: 'project-documentation-section',
        ariaControls: 'project-documentation-section',
        label: 'Documentation',
        disabled: areProjectSpecificTabsDisabled,
        component: <ProjectDocumentation {...rest} mode="edit" />,
      }),
    },
  ]

  const submitProject = async () => {
    setIsLoading(true)

    try {
      const result = await api(`api/projects/v2/`, {
        data: {
          bp_activity: bpId,
          agency: projIdentifiers.current_agency,
          lead_agency: projIdentifiers?.is_lead_agency
            ? projIdentifiers.current_agency
            : projIdentifiers.side_agency,
          ...omit(projIdentifiers, [
            'current_agency',
            'side_agency',
            'is_lead_agency',
          ]),
          ...pickBy(
            crossCuttingFields,
            (value) => !isNil(value) && value !== '',
          ),
          ...pickBy(
            projectSpecificFields,
            (value) => !isNil(value) && value !== '',
          ),
          ods_odp: map(projectSpecificFields.ods_odp, (ods_odp) =>
            omit(
              pickBy(ods_odp, (value) => !isNil(value) && value !== ''),
              'id',
            ),
          ),
        },
        method: 'POST',
      })

      setIsLoading(false)
      setIsSubmitSuccessful(true)
      setProjectId(result.id)
    } catch (error) {
      setIsLoading(false)
      setIsSubmitSuccessful(false)
      setProjectId(null)
    }
  }

  const defaultActionButtons = (
    <div className="flex flex-wrap items-center gap-2.5">
      <Button
        className={cx('ml-auto mr-0 h-10 px-3 py-1', {
          'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow':
            !isSubmitDisabled,
        })}
        size="large"
        variant="contained"
        onClick={submitProject}
        disabled={isSubmitDisabled}
      >
        Submit
      </Button>
      {isLoading && (
        <CircularProgress color="inherit" size="30px" className="ml-1.5" />
      )}
    </div>
  )

  return (
    <>
      <HeaderTitle>
        <div className="align-center flex justify-between">
          <PageHeading className="min-w-fit">{heading}</PageHeading>
          {actionButtons ?? defaultActionButtons}
        </div>
      </HeaderTitle>

      <div className="flex flex-col gap-6">
        <div>
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
              .map((step) => step.component)}
          </div>
        </div>
      </div>
      {!isNil(isSubmitSuccessful) && (
        <Alert
          className="BPAlert mt-4 w-fit border-0"
          severity={isSubmitSuccessful ? 'success' : 'error'}
        >
          {isSubmitSuccessful && projectId ? (
            <Link
              className="text-xl text-inherit no-underline"
              href={`/projects-listing/${projectId}`}
            >
              <p className="m-0 text-lg">
                Submission was successful. View project.
              </p>
            </Link>
          ) : (
            <p className="m-0 text-lg">An error occurred. Please try again</p>
          )}
        </Alert>
      )}
    </>
  )
}

export default ProjectsCreate
