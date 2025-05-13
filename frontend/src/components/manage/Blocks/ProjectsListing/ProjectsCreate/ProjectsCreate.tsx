'use client'

import { useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Link from '@ors/components/ui/Link/Link'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import ProjectIdentifiersSection from './ProjectIdentifiersSection.tsx'
import ProjectBPLinking from './ProjectBPLinking'
import ProjectCrossCuttingFields from './ProjectCrossCuttingFields'
import ProjectOverview from './ProjectOverview.tsx'
import ProjectSubstanceDetails from './ProjectSubstanceDetails.tsx'
import ProjectImpact from './ProjectImpact.tsx'
import {
  CrossCuttingFields,
  ProjIdentifiers,
  SpecificFields,
} from '../interfaces.ts'
import { api } from '@ors/helpers'

import { Alert, Button, CircularProgress, Tabs, Tab } from '@mui/material'
import { isNil, map, omit, pickBy } from 'lodash'
import cx from 'classnames'

const initialCrossCuttingFields = (): CrossCuttingFields => {
  return {
    project_type: null,
    sector: null,
    subsector: [],
    is_lvc: null,
    title: '',
    description: '',
    project_start_date: '',
    project_end_date: '',
    total_fund: '',
    support_cost_psc: '',
    psc: '',
    individual_consideration: true,
  }
}

const initialProjectSpecificFields = (): SpecificFields => {
  return {
    tranche: null,
    is_sme: null,
    products_manufactured: '',
    group: null,
    ods_odp: [],
  }
}

const ProjectsCreate = () => {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [currentTab, setCurrentTab] = useState<number>(0)
  const [projIdentifiers, setProjIdentifiers] = useState<ProjIdentifiers>({
    is_lead_agency: true,
    country: null,
    meeting: null,
    current_agency: null,
    side_agency: null,
    cluster: null,
  })
  const [isLinkedToBP, setIsLinkedToBP] = useState<boolean>(false)
  const [bpId, setBpId] = useState<number>()
  const [crossCuttingFields, setCrossCuttingFields] =
    useState<CrossCuttingFields>(initialCrossCuttingFields)
  const [projectSpecificFields, setProjectSpecificFields] =
    useState<SpecificFields>(initialProjectSpecificFields)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState<boolean>()

  const canLinkToBp = !!(
    projIdentifiers.country &&
    projIdentifiers.meeting &&
    projIdentifiers.cluster &&
    ((projIdentifiers.is_lead_agency && projIdentifiers.current_agency) ||
      (!projIdentifiers.is_lead_agency && projIdentifiers.side_agency))
  )

  const areNextSectionsDisabled = !canLinkToBp || currentStep < 1
  const isSubmitDisabled =
    areNextSectionsDisabled ||
    !(
      crossCuttingFields.project_type &&
      crossCuttingFields.sector &&
      crossCuttingFields.title
    )
  const areProjectSpecificTabsDisabled =
    areNextSectionsDisabled ||
    !crossCuttingFields.project_type ||
    !crossCuttingFields.sector

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
            isSubmitSuccessful,
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
      disabled: areProjectSpecificTabsDisabled,
      component: (
        <ProjectOverview
          {...{
            projectSpecificFields,
            setProjectSpecificFields,
          }}
        />
      ),
    },
    {
      step: 4,
      id: 'project-substance-details-section',
      ariaControls: 'project-substance-details-section',
      label: 'Substance details',
      disabled: areProjectSpecificTabsDisabled,
      component: (
        <ProjectSubstanceDetails
          {...{
            projectSpecificFields,
            setProjectSpecificFields,
          }}
        />
      ),
    },
    // {
    //   step: 5,
    //   id: 'project-impact-section',
    //   ariaControls: 'project-impact-section',
    //   label: 'Impact',
    //   disabled: areProjectSpecificTabsDisabled,
    //   component: (
    //     <ProjectImpact
    //       {...{
    //         projectSpecificFields,
    //         setProjectSpecificFields,
    //       }}
    //     />
    //   ),
    // },
  ]

  const submitProject = async () => {
    setIsLoading(true)

    try {
      await api(`api/projects/v2/`, {
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
    } catch (error) {
      setIsLoading(false)
      setIsSubmitSuccessful(false)
    }
  }

  return (
    <>
      <HeaderTitle>
        <div className="align-center flex justify-between">
          <PageHeading>New project submission</PageHeading>
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
              <CircularProgress
                color="inherit"
                size="30px"
                className="ml-1.5"
              />
            )}
          </div>
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
            {steps.map(({ id, ariaControls, label, disabled }: any) => (
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
          {isSubmitSuccessful ? (
            <Link
              className="text-xl text-inherit no-underline"
              href="/projects-listing/"
            >
              <p className="m-0 text-lg">Project submitted successfully</p>
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
