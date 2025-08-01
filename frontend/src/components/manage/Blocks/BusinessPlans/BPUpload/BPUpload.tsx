'use client'

import { useContext, useEffect, useState } from 'react'

import BPYearRangesContext from '@ors/contexts/BusinessPlans/BPYearRangesContext'
import useGetBpPeriods from '../BPList/useGetBPPeriods'
import { RedirectToBpList } from '../RedirectToBpList'
import BPExport from './BPExport'
import BPImport from './BPImport'
import BPImportFilters from './BPImportFilters'
import BPReviewChanges from './BPReviewChanges'
import BPUploadSectionWrapper from './BPUploadSectionWrapper'
import { getLatestBpYearRange } from '../utils'

const BPUploadHeader = () => (
  <div>
    <RedirectToBpList />
    <div className="mb-4 flex min-h-[40px] flex-wrap items-center justify-between gap-x-8 gap-y-2">
      <h1 className="m-0 text-5xl leading-normal">Upload Business Plan</h1>
    </div>
  </div>
)

const BPUpload = () => {
  const { yearRanges } = useContext(BPYearRangesContext)
  const { periodOptions } = useGetBpPeriods(yearRanges)
  const currentYearRange = periodOptions?.[0]?.value
  const latestBpYearRange = getLatestBpYearRange(periodOptions)

  const [filters, setFilters] = useState<any>({})
  const [downloadFilters, setDownloadFilters] = useState<any>({})
  const [file, setFile] = useState<FileList | null>(null)
  const [validations, setValidations] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    if (currentYearRange) {
      const [year_start, year_end] = currentYearRange.split('-')
      setFilters({
        year_end,
        year_start,
      })
    }
    if (latestBpYearRange) {
      const [year_start, year_end] = latestBpYearRange.label.split('-')
      setDownloadFilters({ year_end, year_start })
    }
  }, [currentYearRange])

  const isFiltersNextBtnEnabled =
    filters.year_start && filters.bp_status && filters.meeting

  const steps = [
    {
      component: (
        <BPImportFilters
          {...{
            periodOptions,
            setCurrentStep,
            filters,
            setFilters,
          }}
          isBtnDisabled={!isFiltersNextBtnEnabled}
        />
      ),
      step: 1,
    },
    {
      component: (
        <BPExport
          {...{
            downloadFilters,
            filters,
            periodOptions,
            setCurrentStep,
            setDownloadFilters,
          }}
        />
      ),
      step: 2,
    },
    {
      component: (
        <BPImport
          {...{
            file,
            filters,
            setCurrentStep,
            setFile,
            setValidations,
            periodOptions,
          }}
        />
      ),
      step: 3,
    },
    {
      component: (
        <BPReviewChanges
          {...{
            file,
            filters,
            periodOptions,
            setCurrentStep,
            validations,
            setFile,
          }}
        />
      ),
      step: 4,
    },
  ]

  return (
    <div className="flex flex-col gap-2">
      <BPUploadHeader />
      <div className="flex flex-col gap-6">
        {steps
          .filter(({ step }) => step <= currentStep)
          .map(({ component, step }) => (
            <div key={step}>
              <BPUploadSectionWrapper
                isCurrentStep={currentStep === step}
                step={step}
              >
                {component}
              </BPUploadSectionWrapper>
            </div>
          ))}
      </div>
    </div>
  )
}

export default BPUpload
