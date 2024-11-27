'use client'

import { useContext, useEffect, useState } from 'react'

import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import BPYearRangesProvider from '@ors/contexts/BusinessPlans/BPYearRangesProvider'

import useGetBpPeriods from '../BPList/useGetBPPeriods'
import { RedirectToBpList } from '../RedirectToBpList'
import BPUploadFilters from './BPUploadFilters'
import BPUploadSectionWrapper from './BPUploadSectionWrapper'

const BPUploadHeader = ({ currentYearRange }: any) => {
  return (
    <div>
      <RedirectToBpList {...{ currentYearRange }} />
      <div className="mb-4 flex min-h-[40px] flex-wrap items-center justify-between gap-x-8 gap-y-2">
        <h1 className="m-0 text-5xl leading-normal">Upload business plan</h1>
      </div>
    </div>
  )
}

const BPUpload = () => {
  const { yearRanges } = useContext(BPYearRangesContext) as any
  const { periodOptions } = useGetBpPeriods(yearRanges)

  const currentYearRange = periodOptions?.[0]?.value

  const [filters, setFilters] = useState({})
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    if (currentYearRange) {
      setFilters(() => {
        const [year_start, year_end] = currentYearRange.split('-')
        return { year_end, year_start }
      })
    }
  }, [currentYearRange])
  console.log(filters)

  const steps = [
    {
      component: (
        <BPUploadFilters
          {...{ currentStep, periodOptions, setFilters }}
          step={1}
        />
      ),
      step: 1,
    },
    {
      component: (
        <></>
        // <BPUploadFilters
        //   {...{ currentStep, periodOptions, setCurrentStep }}
        //   step={2}
        // />
      ),
      step: 2,
    },
    {
      component: (
        <></>
        // <BPImportActivities
        //   isCurrentStep={currentStep === 2}
        //   setCurrentStep={setCurrentStep}
        // />
      ),
      step: 3,
    },
    {
      component: (
        <></>
        // <BPReviewChanges
        //   {...props}
        //   isCurrentStep={currentStep === 3}
        //   setCurrentStep={setCurrentStep}
        // />
      ),
      step: 4,
    },
  ]

  return (
    <div className="flex flex-col gap-2">
      <BPUploadHeader {...{ currentYearRange }} />
      <div className="flex flex-col gap-6">
        {steps
          .filter((step) => step.step <= currentStep)
          .map((step) => (
            <div key={step.step}>
              <BPUploadSectionWrapper
                {...{ currentStep, filters, setCurrentStep }}
                step={step.step}
              >
                {step.component}
              </BPUploadSectionWrapper>
            </div>
          ))}
      </div>
    </div>
  )
}

export default function BPUploadWrapper() {
  return (
    <BPYearRangesProvider>
      <BPUpload />
    </BPYearRangesProvider>
  )
}
