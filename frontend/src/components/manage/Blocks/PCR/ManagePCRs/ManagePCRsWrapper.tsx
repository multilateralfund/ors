import { useMemo, useRef, useState } from 'react'

import HeaderTitle from '@ors/components/theme/Header/HeaderTitle'
import Loading from '@ors/components/theme/Loading/Loading'
import CustomLink from '@ors/components/ui/Link/Link'
import { TypeableDateInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { PageHeading } from '@ors/components/ui/Heading/Heading'
import {
  RedirectBackButton,
  CancelButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import {
  FieldErrorIndicator,
  SubmitButton,
} from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import ManagePCRsFiltersSelectedOpts from './ManagePCRsFiltersSelectedOpts'
import ManagePCRsFilters from './ManagePCRsFilters'
import ManagePCRsTable from './ManagePCRsTable'
import {
  initialFilters,
  categoryOpts,
  booleanFieldsOpts,
  requiredMessage,
  borderedContainerClassname,
} from '../constants'
import { useGetPCRProjects } from '../hooks/useGetPCRProjects'
import { useGetPcrFilters } from '../hooks/useGetPcrFilters'
import { api, formatApiUrl } from '@ors/helpers'

import { CircularProgress, Modal, Typography, Box } from '@mui/material'
import { unionBy, upperFirst } from 'lodash'
import { enqueueSnackbar } from 'notistack'
import cx from 'classnames'

const ManagePCRsWrapper = () => {
  const form = useRef<any>()

  const updatedInitialFilters = {
    ...initialFilters,
    completed_only: [booleanFieldsOpts[0]],
    category: [categoryOpts[1]],
  }
  const updatedInitialParams = {
    ...initialFilters,
    pcr_submitted: ['No'],
    pcr_due: ['No'],
    completed_only: ['Yes'],
    category: [categoryOpts[1].id],
  }
  const pcrDueInitialParams = { ...updatedInitialParams, pcr_due: ['Yes'] }

  const [projectIds, setProjectIds] = useState<number[]>([])
  const [action, setAction] = useState<'mark' | 'unmark' | null>(null)
  const [pcrDueDate, setPcrDueDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState(updatedInitialFilters)
  const key = useMemo(() => JSON.stringify(filters), [filters])

  const pcrProjects = useGetPCRProjects(updatedInitialParams)
  const { loading, setParams, refetch } = pcrProjects

  const pcrDueProjects = useGetPCRProjects(pcrDueInitialParams)
  const {
    loading: loadingPcrDue,
    setParams: setParamsPcrDue,
    refetch: refetchPcrDue,
  } = pcrDueProjects

  const pcrFilters = useGetPcrFilters({
    ...updatedInitialParams,
    pcr_due_union: true,
  })
  const { data: filterOptions, setParams: setParamsFilters } = pcrFilters

  const actionText = {
    mark: 'mark as PCR due',
    unmark: 'remove PCR due status',
  }

  const withDefaultOption = (field: string) =>
    unionBy(
      filterOptions?.[field] ?? [],
      (filters as Record<string, any>)[field] ?? [],
      'id',
    )

  const fieldToOptionsMapping: Record<string, any[]> = {
    region: filterOptions?.region ?? [],
    country: filterOptions?.country ?? [],
    lead_agency: filterOptions?.lead_agency ?? [],
    cluster: filterOptions?.cluster ?? [],
    category: withDefaultOption('category'),
    completed_only: withDefaultOption('completed_only'),
  }

  const handleFilterChange = (newFilters: { [key: string]: any }) => {
    setFilters((filters) => ({ ...filters, ...newFilters }))
  }

  const handleParamsChange = (params: { [key: string]: any }) => {
    setParams(params)
    setParamsPcrDue(params)
    setParamsFilters(params)
  }

  const filtersProps = {
    form,
    filters,
    fieldToOptionsMapping,
    handleFilterChange,
    handleParamsChange,
  }

  const unmarkProjects = (ids: number[]) => {
    setAction('unmark')
    setProjectIds(ids)
  }

  const resetData = () => {
    setProjectIds([])
    setAction(null)
    setPcrDueDate('')
    refetch()
    refetchPcrDue()
  }

  const updatePcrDueProjects = async () => {
    const isMarking = action === 'mark'

    setIsLoading(true)

    try {
      await api('api/pcr-metaprojects/set_pcr_or_ad_hoc/', {
        data: {
          meta_projects: projectIds,
          pcr_due: isMarking,
          ...(isMarking && { pcr_due_date: pcrDueDate }),
        },
        method: 'POST',
      })

      const successText =
        action === 'mark'
          ? 'Marked project(s) as PCR due.'
          : 'Removed PCR due status from project.'

      enqueueSnackbar(<>{successText}</>, {
        variant: 'success',
      })

      resetData()
    } catch (e) {
      enqueueSnackbar(<>An error occurred. Please try again.</>, {
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Loading
        className="!fixed bg-action-disabledBackground"
        active={loading || loadingPcrDue}
      />
      <HeaderTitle>
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <RedirectBackButton />
            <PageHeading>Manage Project Completion Reports</PageHeading>
          </div>
          <a
            className="ml-auto mt-auto h-10 rounded-lg border border-solid border-primary bg-primary px-3 py-2 font-medium uppercase text-mlfs-hlYellow no-underline"
            href={formatApiUrl('/admin/core/projectpcrrequiredexclusionrule/')}
            rel="noopener noreferrer"
            target="_blank"
          >
            PCR exclusion rules
          </a>
        </div>
      </HeaderTitle>
      {!!action && (
        <Modal
          aria-labelledby="manage-pcrs-modal"
          open={!!action}
          onClose={() => {
            setAction(null)

            if (action === 'unmark') {
              setProjectIds([])
            }
          }}
        >
          <Box className="flex w-full max-w-[90%] flex-col gap-3 absolute-center md:max-w-xl">
            <Typography className="text-2xl font-medium">
              {upperFirst(actionText[action])}
            </Typography>
            <Typography className="text-lg">
              Are you sure you want to {actionText[action]}{' '}
              {action === 'unmark' && 'from'} the selected project(s)?
            </Typography>
            {action === 'mark' && (
              <div className="my-4 flex flex-row flex-wrap items-center gap-2">
                <Label>PCR due date</Label>
                <div className="flex items-center">
                  <TypeableDateInput
                    id="pcr_due_date"
                    className="BPListUpload !ml-0 h-10 w-40 !flex-grow-0"
                    value={pcrDueDate}
                    onChange={(event) => {
                      setPcrDueDate(event.target.value || '')
                    }}
                  />
                  {!pcrDueDate && (
                    <FieldErrorIndicator
                      errors={{ pcr_due_date: [requiredMessage] }}
                      field="pcr_due_date"
                    />
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-3">
              <CustomLink
                className="text-lg"
                href={null}
                onClick={updatePcrDueProjects}
                disabled={action === 'mark' && !pcrDueDate}
                variant="contained"
                color="secondary"
                button
              >
                {actionText[action]}
              </CustomLink>
              <CancelButton
                onClick={() => {
                  setAction(null)

                  if (action === 'unmark') {
                    setProjectIds([])
                  }
                }}
              />
              {isLoading && (
                <CircularProgress
                  className="text-align mb-1 ml-1.5 mt-auto"
                  color="inherit"
                  size="30px"
                />
              )}
            </div>
          </Box>
        </Modal>
      )}
      <div className="flex flex-col gap-6" key={key}>
        <div className="flex flex-col gap-2.5">
          <ManagePCRsFilters {...filtersProps} />
          <ManagePCRsFiltersSelectedOpts {...filtersProps} />
        </div>
        <div className="flex flex-row gap-4 md:gap-8">
          <div
            className={cx(
              'w-[60%] rounded-lg bg-white',
              borderedContainerClassname,
            )}
          >
            <div className="flex flex-wrap items-center justify-between px-5">
              <h2>Projects</h2>
              <SubmitButton
                title="Mark as PCR due"
                isDisabled={action === 'unmark' || projectIds.length === 0}
                onSubmit={() => {
                  setAction('mark')
                }}
                className="!h-8"
              />
            </div>
            <ManagePCRsTable
              type="not-due"
              {...{ pcrProjects, projectIds, setProjectIds, filters }}
            />
          </div>
          <div
            className={cx(
              'w-[40%] rounded-lg bg-white',
              borderedContainerClassname,
            )}
          >
            <h2 className="px-5">PCR due</h2>
            <ManagePCRsTable
              type="due"
              pcrProjects={pcrDueProjects}
              {...{ unmarkProjects, filters }}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default ManagePCRsWrapper
