import { useState } from 'react'

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from '@mui/material'
import cx from 'classnames'

import { CancelButton, SubmitButton } from '@ors/components/ui/Button/Button'
import Link from '@ors/components/ui/Link/Link'

import { IoEllipse } from 'react-icons/io5'
import { MdExpandMore } from 'react-icons/md'

const BPReviewChanges = ({
  agency,
  isCurrentStep,
  period,
  setCurrentStep,
}: {
  agency: string
  isCurrentStep: boolean
  period: string
  setCurrentStep: any
}) => {
  const [expanded, setExpanded] = useState<Array<any>>([])

  const handleChange = (issue: any) => (_: any, newExpanded: boolean) => {
    if (issue.text.length > 0) {
      setExpanded(
        newExpanded
          ? [...expanded, issue.key]
          : expanded.filter((exp) => exp !== issue.key),
      )
    }
  }

  const changedActivities = [
    { nrActivities: '23', operation: 'Updated' },
    { nrActivities: '7', operation: 'Created' },
    { nrActivities: '3', operation: 'Deleted' },
  ]

  const fileIssues = [
    { key: 'Errors', text: [] },
    {
      key: 'Warnings',
      text: [
        'very long warning 1 very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1very long warning 1',
        'very long error 2',
      ],
    },
  ]

  return (
    <Box className="flex flex-col gap-6 border-black p-6 shadow-none">
      <div>
        <p className="m-0 text-base uppercase text-gray-500 text-secondary">
          Step 3
        </p>
        <p
          className={cx('m-0 text-2xl', {
            'text-gray-500': !isCurrentStep,
          })}
        >
          Review changes
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          {changedActivities.map((activity: any, index: number) => (
            <Box
              key={index}
              className="flex w-60 justify-between bg-gray-B50 p-4 shadow-none"
            >
              <p className="m-0 font-medium uppercase text-primary">
                {activity.operation}
              </p>
              <p className="m-0 font-medium">
                {activity.nrActivities} activities
              </p>
            </Box>
          ))}
        </div>
        <div className="max-w-[744px] ">
          {fileIssues.map((issue: any, index: number) => (
            <Accordion
              key={index}
              className="m-0 rounded-lg"
              expanded={expanded.includes(issue.key)}
              onChange={handleChange(issue)}
            >
              <AccordionSummary
                id="panel1d-header"
                className={cx(
                  'border-gray-200 bg-gray-B50 hover:text-primary',
                  {
                    'border-b border-solid': expanded.includes(issue.key),
                  },
                )}
                aria-controls="panel1d-content"
                expandIcon={
                  issue.text.length > 0 && (
                    <MdExpandMore className="text-primary" size={22} />
                  )
                }
              >
                <div className="flex gap-5">
                  <Typography
                    className={cx('w-16 font-medium', {
                      'text-gray-400': issue.text.length === 0,
                    })}
                  >
                    {issue.key}
                  </Typography>
                  <Typography
                    className={cx('w-16 font-medium', {
                      'text-gray-400': issue.text.length === 0,
                    })}
                  >
                    {issue.text.length}
                  </Typography>
                </div>
              </AccordionSummary>
              <AccordionDetails>
                {issue.text.map((text: string, index: number) => (
                  <div key={index} className="flex items-baseline gap-1.5">
                    <IoEllipse className="min-h-2 min-w-2" size={8} />
                    <Typography>{text}</Typography>
                  </div>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-5">
        <Link
          className="no-underline"
          href={`/business-plans/${agency}/${period}`}
        >
          <SubmitButton className="h-10 !text-[15px]">
            Submit changes
          </SubmitButton>
        </Link>
        <SubmitButton
          className="h-10 !text-[15px]"
          onClick={() => setCurrentStep(2)}
        >
          Change file
        </SubmitButton>
        <Link
          className="no-underline"
          href={`/business-plans/${agency}/${period}`}
        >
          <CancelButton className="h-10 !text-[15px]">Cancel</CancelButton>
        </Link>
      </div>
    </Box>
  )
}

export default BPReviewChanges
