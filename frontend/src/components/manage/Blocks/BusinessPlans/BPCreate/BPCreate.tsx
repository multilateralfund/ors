'use client'

import { ApiAgency } from '@ors/types/api_agencies'
import { ApiEditBPActivity } from '@ors/types/api_bp_get'

import React, {
  ChangeEventHandler,
  PropsWithChildren,
  useCallback,
  useEffect,
} from 'react'

import { Button, Tab, Tabs } from '@mui/material'
import { entries, filter, find, indexOf, isEmpty, map, values } from 'lodash'
import { useSnackbar } from 'notistack'

import BPCreateProvider, {
  useBPCreate,
  useBPCreateDispatch,
} from '@ors/components/manage/Blocks/BusinessPlans/BPCreate/Provider/BPCreateProvider'
import { ActionType } from '@ors/components/manage/Blocks/BusinessPlans/BPCreate/Provider/actions'
import { BPEditBaseTable } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/BPEditTable'
import { FilesViewer } from '@ors/components/manage/Blocks/Section/ReportInfo/FilesViewer'
import SimpleField from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleField'
import Field from '@ors/components/manage/Form/Field'
import Link from '@ors/components/ui/Link/Link'
import VersionHistoryList from '@ors/components/ui/VersionDetails/VersionHistoryList'
import { api } from '@ors/helpers'
import { useStore } from '@ors/store'

import SimpleInput from '../../Section/ReportInfo/SimpleInput'
import useGetBpPeriods from '../BPList/useGetBPPeriods'
import { RedirectToBpList } from '../RedirectToBpList'
import { tableColumns } from '../constants'
import { useGetYearRanges } from '../useGetYearRanges'
import CloneActivitiesDialog from './CloneActivitiesDialog'

function BPCreateHeader(props: PropsWithChildren) {
  const ctx = useBPCreate()
  const activities = ctx.activities
  const yearStart = ctx.yearRange.year_start - 1

  const { enqueueSnackbar } = useSnackbar()

  const getFormattedActivities = useCallback(
    () =>
      map(activities, (activity) => ({
        ...activity,
        values: filter(activity.values, (value) => value.year !== yearStart),
      })),
    [yearStart, activities],
  )

  const handleSubmitBP = async () => {
    try {
      const response = await api('api/business-plan/', {
        data: {
          activities: getFormattedActivities(),
          agency_id: ctx.reportingAgency?.id,
          name: ctx.reportingOfficer,
          status: 'Agency Draft',
          year_end: ctx.yearRange.year_end,
          year_start: ctx.yearRange.year_start,
        },
        method: 'POST',
      })

      enqueueSnackbar(<>Submitted business plan {response.name}.</>, {
        variant: 'success',
      })
    } catch (error) {
      if (error.status === 400) {
        const errors = await error.json()
        const firstDataError = find(errors.activities, (err) => !isEmpty(err))
        const index = indexOf(errors.activities, firstDataError)

        if (firstDataError) {
          enqueueSnackbar(
            <div className="flex flex-col">
              Row {index + 1}
              {entries(firstDataError).map((error) => {
                const headerName = tableColumns[error[0]]
                const errorMessage = (error[1] as Array<string>)[0]

                return ['project_type_code', 'sector_code'].includes(
                  error[0],
                ) ? null : headerName ? (
                  <div key={error[0]}>
                    {headerName} - {errorMessage}
                  </div>
                ) : (
                  <>{errorMessage}</>
                )
              })}
            </div>,
            {
              variant: 'error',
            },
          )
        } else {
          enqueueSnackbar(<>{values(errors)[0]}</>, {
            variant: 'error',
          })
        }
      } else {
        enqueueSnackbar(<>An error occurred. Please try again.</>, {
          variant: 'error',
        })
      }
    }
  }

  return (
    <div className="mb-4 flex min-h-[40px] flex-wrap items-center justify-between gap-x-8 gap-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-2">
          <h1 className="m-0 text-5xl leading-normal">{props.children}</h1>
        </div>
      </div>
      <div className="ml-auto">
        <div className="flex items-center">
          <div className="container flex w-full justify-between gap-x-4 px-0">
            <Link
              className="border border-solid border-primary bg-white px-4 py-2 text-primary
                shadow-none hover:bg-primary hover:text-white"
              color="primary"
              href={`/business-plans/`}
              size="large"
              variant="contained"
              button
            >
              Cancel
            </Link>
            <Button
              className="px-4 py-2 shadow-none hover:text-white"
              size="large"
              variant="contained"
              onClick={handleSubmitBP}
            >
              Save draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AgencyField() {
  const ctx = useBPCreate()
  const dispatch = useBPCreateDispatch()

  const agencies = useStore((state) => state?.common.agencies.data)
  const { user_type } = useStore((state) => state.user?.data)

  function handleChangeReportingAgency(
    _: React.ChangeEvent,
    option: ApiAgency,
  ) {
    dispatch({
      payload: option as ApiAgency,
      type: ActionType.setReportingAgency,
    })
  }
  const agencyFieldProps = {
    FieldProps: { className: 'mb-0 ReportInfo' },
    getOptionLabel: (option: ApiAgency) => option.name,
    onChange: handleChangeReportingAgency,
    options: agencies,
    value: ctx.reportingAgency,
    widget: 'autocomplete',
  }

  return (
    <>
      {['admin', 'secretariat'].includes(user_type) ? (
        <div className="flex h-full flex-col justify-end">
          <label
            className="mb-2 block text-lg font-normal text-gray-900"
            htmlFor="agency"
          >
            Agency
          </label>
          <Field id="agency" name="agency_id" {...(agencyFieldProps as any)} />
        </div>
      ) : (
        <SimpleField
          id="agency"
          data={ctx.reportingAgency?.name ?? '-'}
          label="Agency"
        />
      )}
    </>
  )
}

function BPCreateContentDetails() {
  const ctx = useBPCreate()
  const dispatch = useBPCreateDispatch()

  const handleChangeReportingOfficer: ChangeEventHandler<HTMLInputElement> = (
    evt,
  ) =>
    dispatch({
      payload: evt.target.value,
      type: ActionType.setReportingOfficer,
    })

  const handleChangeReportingYear: ChangeEventHandler<HTMLInputElement> = (
    evt,
  ) =>
    dispatch({
      payload: parseInt(evt.target.value, 10),
      type: ActionType.setCurrentYear,
    })

  return (
    <section className="grid items-start gap-6 md:auto-rows-auto md:grid-cols-2">
      <div className="flex flex-col gap-6 rounded-lg bg-gray-100 p-4">
        <p className="m-0 text-2xl font-normal">Summary</p>
        <div className="grid w-full gap-4 md:grid-cols-2 md:grid-rows-3 lg:grid-cols-3 lg:grid-rows-2">
          <SimpleInput
            id="name_reporting_officer"
            label="Name of reporting officer"
            type="text"
            value={ctx.reportingOfficer}
            onChange={handleChangeReportingOfficer}
          />
          <AgencyField />
          <SimpleInput
            id="year"
            label="Year"
            type="text"
            value={ctx.currentYear.toString()}
            onChange={handleChangeReportingYear}
          />
        </div>

        <FilesViewer files={[]} heading={'File attachments'} isEdit={false} />
      </div>

      <div className="flex flex-col rounded-lg bg-gray-100 p-4">
        <VersionHistoryList
          currentDataVersion={1}
          historyList={[]}
          length={3}
          type="bp"
        />
      </div>
    </section>
  )
}

function BPCreateContentActivities() {
  const ctx = useBPCreate()
  const dispatch = useBPCreateDispatch()

  return (
    <BPEditBaseTable
      form={ctx.activities}
      isEdit={false}
      loading={false}
      params={[]}
      yearRangeSelected={ctx.yearRange}
      setForm={(form) =>
        dispatch({
          payload: form as ApiEditBPActivity[],
          type: ActionType.addActivity,
        })
      }
    />
  )
}

function BPCreate() {
  const { results: yearRanges } = useGetYearRanges()
  const { periodOptions } = useGetBpPeriods(yearRanges)
  const { bpFilters } = useStore((state) => state.bpFilters)

  const currentYearRange = bpFilters.range
    ? bpFilters.range
    : periodOptions?.[0]?.value

  const ctx = useBPCreate()
  const agencyId = ctx.reportingAgency?.id

  const dispatch = useBPCreateDispatch()

  useEffect(() => {
    if (!agencyId) {
      dispatch({
        payload: [] as ApiEditBPActivity[],
        type: ActionType.addActivity,
      })
    }
  }, [agencyId, dispatch])

  return (
    <>
      <div>
        <RedirectToBpList {...{ currentYearRange }} />
        {agencyId && (
          <CloneActivitiesDialog
            key={agencyId + '-' + ctx.yearRange.year_start}
            setForm={(form: ApiEditBPActivity[]) =>
              dispatch({
                payload: form as ApiEditBPActivity[],
                type: ActionType.addActivity,
              })
            }
          />
        )}
        <BPCreateHeader>
          New business plan ({ctx.reportingAgency?.name}{' '}
          {ctx.yearRange.year_start} - {ctx.yearRange.year_end})
        </BPCreateHeader>
      </div>
      <div className="flex items-center justify-between gap-2 lg:flex-nowrap print:hidden">
        <Tabs
          className="scrollable w-96"
          aria-label="view country programme report"
          scrollButtons="auto"
          value={ctx.activeTab}
          variant="scrollable"
          TabIndicatorProps={{
            className: 'h-0',
            style: { transitionDuration: '150ms' },
          }}
          onChange={(_, newValue) => {
            dispatch({ payload: newValue, type: ActionType.setActiveTab })
          }}
          allowScrollButtonsMobile
        >
          <Tab
            id="activities"
            className="rounded-b-none px-3 py-2"
            aria-controls="activities"
            label="Activities"
            classes={{
              selected:
                'bg-primary text-mlfs-hlYellow px-3 py-2 rounded-b-none',
            }}
          />
          <Tab
            id="details"
            className="rounded-b-none px-3 py-2"
            aria-controls="business-plan-details"
            label="Details"
            classes={{
              selected:
                'bg-primary text-mlfs-hlYellow px-3 py-2 rounded-b-none',
            }}
          />
        </Tabs>
      </div>
      <div className="relative rounded-b-lg rounded-r-lg border border-solid border-primary bg-white p-6">
        {ctx.activeTab === 0 ? <BPCreateContentActivities /> : null}
        {ctx.activeTab === 1 ? <BPCreateContentDetails /> : null}
      </div>
    </>
  )
}

export default function BPCreateWrapper() {
  return (
    <BPCreateProvider>
      <BPCreate />
    </BPCreateProvider>
  )
}
