'use client'

import { useState } from 'react'

import Link from '@ors/components/ui/Link/Link'
import ProjectIdentifiersSection from './ProjectIdentifiersSection'
import ProjectBPLinking from './ProjectBPLinking'
import ProjectCrossCuttingFields from './ProjectCrossCuttingFields'
import { api } from '@ors/helpers'

import { Alert, Box, Button, CircularProgress } from '@mui/material'
import { isNil, omit } from 'lodash'
import cx from 'classnames'

const ProjectsCreate = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [projIdentifiers, setProjIdentifiers] = useState<any>({
    is_lead_agency: true,
  })
  const [crossCuttingFields, setCrossCuttingFields] = useState<any>({})
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState<boolean>()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const steps = [
    {
      component: (
        <ProjectIdentifiersSection
          {...{
            setCurrentStep,
            projIdentifiers,
            setProjIdentifiers,
          }}
        />
      ),
      step: 1,
    },
    {
      component: (
        <ProjectBPLinking
          {...{
            setCurrentStep,
            projIdentifiers,
          }}
        />
      ),
      step: 2,
    },
    {
      component: (
        <ProjectCrossCuttingFields
          {...{
            setCurrentStep,
            crossCuttingFields,
            setCrossCuttingFields,
          }}
        />
      ),
      step: 3,
    },
  ]

  const submitProject = async () => {
    setIsLoading(true)

    try {
      await api(`api/projects/v2/`, {
        data: {
          ...omit(projIdentifiers, [
            'current_agency',
            'side_agency',
            'is_lead_agency',
          ]),
          agency: projIdentifiers?.is_lead_agency
            ? projIdentifiers.current_agency
            : projIdentifiers.side_agency,
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
      <div className="flex flex-col gap-6">
        {steps
          .filter(({ step }) => step <= currentStep)
          .map(({ component, step }) => {
            const isCurrentStep = currentStep === step

            return (
              <Box
                key={step}
                className={cx('p-7 shadow-none', {
                  'border-black': isCurrentStep,
                })}
              >
                <div
                  className={cx('mt-4 flex flex-col gap-y-3', {
                    'pointer-events-none opacity-50': !isCurrentStep,
                  })}
                >
                  {component}
                </div>
              </Box>
            )
          })}
        {currentStep === 3 && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              className="h-10 border border-solid border-secondary bg-secondary px-3 py-1 text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow"
              size="large"
              variant="contained"
              onClick={submitProject}
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
        )}
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
