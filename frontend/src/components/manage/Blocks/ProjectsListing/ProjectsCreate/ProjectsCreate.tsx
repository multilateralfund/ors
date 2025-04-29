'use client'

import { useState } from 'react'

import Link from '@ors/components/ui/Link/Link'
import ProjectIdentifiersSection from './ProjectIdentifiersSection'
import ProjectBPLinking from './ProjectBPLinking'
import ProjectCrossCuttingFields from './ProjectCrossCuttingFields'
import { api } from '@ors/helpers'

import { Alert, Button, CircularProgress, Tabs, Tab } from '@mui/material'
import { isNil, omit } from 'lodash'
import cx from 'classnames'

const ProjectsCreate = () => {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [currentTab, setCurrentTab] = useState<number>(0)
  const [projIdentifiers, setProjIdentifiers] = useState<any>({
    is_lead_agency: true,
  })
  const [isLinkedToBP, setIsLinkedToBP] = useState<boolean>(false)
  const [bpId, setBpId] = useState<number>()
  const [crossCuttingFields, setCrossCuttingFields] = useState<any>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState<boolean>()

  const canLinkToBp =
    projIdentifiers.country &&
    ((projIdentifiers.is_lead_agency && projIdentifiers.current_agency) ||
      (!projIdentifiers.is_lead_agency && projIdentifiers.side_agency)) &&
    projIdentifiers.meeting

  const areNextSectionsDisabled = !canLinkToBp || currentStep < 1
  const isSubmitDisabled =
    areNextSectionsDisabled ||
    !(crossCuttingFields.title && crossCuttingFields.project_type)

  const steps = [
    {
      step: 0,
      id: 'project-identifier-section',
      ariaControls: 'project-identifier-section',
      label: 'Project identifiers',
      component: (
        <ProjectIdentifiersSection
          {...{
            setCurrentStep,
            setCurrentTab,
            projIdentifiers,
            setProjIdentifiers,
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
      label: 'Link to BP',
      disabled: areNextSectionsDisabled,
      component: (
        <ProjectBPLinking
          {...{
            setCurrentStep,
            setCurrentTab,
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
      id: 'project-cross-cutting-fields-section',
      ariaControls: 'project-cross-cutting-fields-section',
      label: 'Cross-Cutting Fields',
      disabled: areNextSectionsDisabled,
      component: (
        <ProjectCrossCuttingFields
          {...{
            setCurrentStep,
            crossCuttingFields,
            setCrossCuttingFields,
          }}
        />
      ),
    },
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
          ...crossCuttingFields,
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
