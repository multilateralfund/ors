import { Dispatch, SetStateAction, useContext, useState } from 'react'

import PermissionsContext from '@ors/contexts/PermissionsContext'
import { CancelButton } from '@ors/components/ui/Button/Button'
import { getMeetingNr } from '@ors/components/manage/Utils/utilFunctions'
import Link from '@ors/components/ui/Link/Link'
import { PeriodSelectorOption } from '../../Replenishment/types'
import { getCurrentTriennium, getLatestBpYearRange } from '../utils'
import { uploadFiles } from '@ors/helpers'
import { useStore } from '@ors/store'

import { IoEllipse } from 'react-icons/io5'
import { MdExpandMore } from 'react-icons/md'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material'
import cx from 'classnames'
import { capitalize, keys } from 'lodash'

interface IBPReviewChanges {
  file: FileList | null
  filters: any
  periodOptions: PeriodSelectorOption[]
  setCurrentStep: Dispatch<SetStateAction<number>>
  setFile: Dispatch<SetStateAction<FileList | null>>
  validations: any
}

const BPReviewChanges = ({
  file,
  filters,
  periodOptions,
  setCurrentStep,
  validations,
  setFile,
}: IBPReviewChanges) => {
  const { setBPType } = useStore((state) => state.bpType)
  const { fetchYearRanges } = useStore((state) => state.yearRanges)

  const { canUpdateBp, canViewBp } = useContext(PermissionsContext)

  const [expandedItems, setExpandedItems] = useState<Array<string>>([])
  const [importResult, setImportResult] = useState<any>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState('')

  const currentTriennium = getCurrentTriennium()

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
    setIsLoading(true)
    try {
      const baseUrl = `api/business-plan/upload/?year_start=${year_start}&year_end=${year_end}&status=${bp_status}&meeting_id=${meeting}`

      const formattedUrl = decision
        ? baseUrl + `&decision_id=${decision}`
        : baseUrl

      if (file) {
        const result = await uploadFiles(formattedUrl, [file[0]])
        setImportResult(result)
        setBPType(bp_status)
        fetchYearRanges()
      }
    } catch (error: any) {
      console.error('Error:', error)
      setUploadError(error?.statusText)
    } finally {
      setIsLoading(false)
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
              <IoEllipse className="min-h-3 min-w-2" size={9} />
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
        {year_start}-{year_end}, meeting number {getMeetingNr(meeting)}
        {decision ? `, decision number ${decision}.` : '.'}{' '}
        {activities_number &&
          `The new version
        contains ${activities_number} ${activities_number === 1 ? 'activity' : 'activities'}${agencies_number && ` for ${agencies_number} ${agencies_number === 1 ? 'agency' : 'agencies'}`}.`}
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
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            className={cx('h-10 px-3 py-1', {
              'border border-solid border-secondary bg-secondary text-white hover:border-primary hover:bg-primary hover:text-mlfs-hlYellow':
                errors.length === 0 && canUpdateBp,
            })}
            disabled={errors.length > 0 || !canUpdateBp}
            size="large"
            variant="contained"
            onClick={submitBP}
          >
            Submit
          </Button>
          <Button
            className="h-10 border border-solid border-primary bg-white px-3 py-1 !text-[15px] text-primary"
            onClick={() => {
              setFile(null)
              setCurrentStep((step) => step - 1)
            }}
          >
            Back
          </Button>
          {isLoading && (
            <CircularProgress color="inherit" size="30px" className="ml-1.5" />
          )}
        </div>
        <Link
          className="no-underline"
          href={`/business-plans/list/report-info/${getLatestBpYearRange(periodOptions)?.value || currentTriennium}`}
        >
          <CancelButton className="h-10 !text-[15px]">
            Cancel Upload
          </CancelButton>
        </Link>
      </div>
      {keys(importResult).length > 0 && !isLoading && (
        <Alert
          className="BPAlert mt-4 w-fit border-0"
          severity={importResult.status === 200 ? 'success' : 'error'}
        >
          {canViewBp ? (
            <Link
              className="text-xl text-inherit no-underline"
              href={`/business-plans/list/report-info/${year_start}-${year_end}`}
              onClick={() => {
                setBPType(bp_status)
              }}
            >
              {importResult.response}.
              {importResult.status === 200 && <> View Business Plan</>}
            </Link>
          ) : (
            <p className="m-0 text-lg">{importResult.response}.</p>
          )}
        </Alert>
      )}
      {uploadError && !isLoading && (
        <Alert className="BPAlert mt-4 w-fit border-0" severity={'error'}>
          <p className="m-0 mt-1 text-lg">{uploadError}</p>
        </Alert>
      )}
    </>
  )
}
export default BPReviewChanges
