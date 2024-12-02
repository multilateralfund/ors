import { Dispatch, SetStateAction, useState } from 'react'

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Typography,
} from '@mui/material'
import cx from 'classnames'
import { capitalize, keys } from 'lodash'

import { CancelButton, SubmitButton } from '@ors/components/ui/Button/Button'
import Link from '@ors/components/ui/Link/Link'
import { uploadFiles } from '@ors/helpers'

import { PeriodSelectorOption } from '../../Replenishment/types'

import { IoEllipse } from 'react-icons/io5'
import { MdExpandMore } from 'react-icons/md'

interface IBPReviewChanges {
  file: FileList | null
  filters: any
  periodOptions: PeriodSelectorOption[]
  setCurrentStep: Dispatch<SetStateAction<number>>
  validations: any
}

const BPReviewChanges = ({
  file,
  filters,
  periodOptions,
  setCurrentStep,
  validations,
}: IBPReviewChanges) => {
  const [expandedItems, setExpandedItems] = useState<Array<string>>([])
  const [importResult, setImportResult] = useState<any>()

  const { bp_status, decision, meeting, year_end, year_start } = filters
  const {
    activities_number,
    agencies_number,
    errors = [],
    warnings = [],
  } = validations

  const handleChangeExpandedItems =
    (type: string) => (_: any, newExpandedItems: boolean) => {
      setExpandedItems(
        newExpandedItems
          ? [...expandedItems, type]
          : expandedItems.filter((exp) => exp !== type),
      )
    }

  const submitBP = async () => {
    try {
      const baseUrl = `api/business-plan/upload/?year_start=${year_start}&year_end=${year_end}&status=${bp_status}&meeting_number=${meeting}`

      const formattedUrl = decision
        ? baseUrl + `&decision_number=${decision}`
        : baseUrl

      if (file) {
        const result = await uploadFiles(formattedUrl, [file[0]])
        setImportResult(result)
      }
    } catch (error: any) {
      console.error('Error:', error)
    }
  }

  const AccordionItem = ({ items, type }: { items: any[]; type: string }) => (
    <Accordion
      className="m-0 rounded-lg"
      expanded={expandedItems.includes(type)}
      onChange={handleChangeExpandedItems(type)}
    >
      <AccordionSummary
        id="panel1d-header"
        className={cx('border-gray-200 bg-gray-B50 hover:text-primary', {
          'border-b border-solid': expandedItems.includes(type),
        })}
        aria-controls="panel1d-content"
        expandIcon={<MdExpandMore className="text-primary" size={22} />}
      >
        <div className="flex gap-5">
          <Typography className="w-16 font-medium">{type}</Typography>
          <Typography className="w-16 font-medium">{items.length}</Typography>
        </div>
      </AccordionSummary>
      <AccordionDetails className="max-h-[450px] overflow-y-auto">
        {items.map((item: any, index: number) => {
          const {
            activity_id,
            error_message,
            error_type,
            row_number,
            warning_message,
            warning_type,
          } = item

          const rowIdentifier = activity_id
            ? `Activity id: ${activity_id}`
            : `Row number: ${row_number}`

          return (
            <div key={index} className="mb-1.5 flex items-baseline gap-1.5">
              <IoEllipse className="min-h-2 min-w-2" size={9} />
              <Typography className="text-lg">
                {(error_type || warning_type).includes('data')
                  ? rowIdentifier + ' - '
                  : ''}
                {type === 'errors' ? error_message : warning_message}
              </Typography>
            </div>
          )
        })}
      </AccordionDetails>
    </Accordion>
  )

  return (
    <>
      <p className="m-0 text-2xl">Review changes</p>
      <p className="mb-0 mt-1 text-xl">
        You are about to replace the {capitalize(bp_status)} Business Plan for{' '}
        {year_start}-{year_end}, meeting number {meeting}. The new version
        contains {activities_number} activities for {agencies_number} agencies.
      </p>
      <div className="max-w-[800px]">
        {errors.length > 0 && <AccordionItem items={errors} type="errors" />}
        {warnings.length > 0 && (
          <AccordionItem items={warnings} type="warnings" />
        )}
      </div>
      {errors.length > 0 && (
        <p className="mb-0 mt-1 text-xl">
          The imported file contains errors. Please go back and correct them!
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <Button
          className={cx('h-10 px-3 py-1', {
            'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow':
              errors.length === 0,
          })}
          disabled={errors.length > 0}
          size="large"
          variant="contained"
          onClick={submitBP}
        >
          Submit
        </Button>
        <SubmitButton
          className="h-10 !text-[15px]"
          onClick={() => setCurrentStep((step) => step - 1)}
        >
          Change file
        </SubmitButton>
        <Link
          className="no-underline"
          href={`/business-plans/list/activities/${periodOptions?.[0]?.value}`}
        >
          <CancelButton className="h-10 !text-[15px]">Cancel</CancelButton>
        </Link>
      </div>
      {keys(importResult).length > 0 && (
        <Alert
          className="BPAlert mt-4 w-fit border-0"
          severity={importResult.status === 200 ? 'success' : 'error'}
        >
          <p className="m-0 text-xl">
            {importResult.response.message}.
            {importResult.status === 200 && (
              <>
                {' '}
                View{' '}
                <Link
                  className="text-inherit no-underline"
                  href={`/business-plans/list/activities/${year_start}-${year_end}`}
                >
                  Business Plan
                </Link>
              </>
            )}
          </p>
        </Alert>
      )}
    </>
  )
}
export default BPReviewChanges
