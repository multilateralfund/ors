'use client'

import { useState } from 'react'

import BPProvider from '@ors/contexts/BusinessPlans/BPProvider'

import BPEditHeader from './BPEditHeader'
import BPExportActivities from './BPExportActivities'
import BPImportActivities from './BPImportActivities'
import BPReviewChanges from './BPReviewChanges'

export default function BPEdit(props: any) {
  const [currentStep, setCurrentStep] = useState(1)

  const steps = [
    {
      component: (
        <BPExportActivities
          {...props}
          isCurrentStep={currentStep === 1}
          setCurrentStep={setCurrentStep}
        />
      ),
      step: 1,
    },
    {
      component: (
        <BPImportActivities
          isCurrentStep={currentStep === 2}
          setCurrentStep={setCurrentStep}
        />
      ),
      step: 2,
    },
    {
      component: (
        <BPReviewChanges
          {...props}
          isCurrentStep={currentStep === 3}
          setCurrentStep={setCurrentStep}
        />
      ),
      step: 3,
    },
  ]

  return (
    <BPProvider>
      <div className="flex flex-col gap-2">
        <BPEditHeader />
        <div className="flex flex-col gap-6">
          {steps
            .filter((step) => step.step <= currentStep)
            .map((step) => (
              <div key={step.step}>{step.component}</div>
            ))}
        </div>
      </div>
    </BPProvider>
  )
}
