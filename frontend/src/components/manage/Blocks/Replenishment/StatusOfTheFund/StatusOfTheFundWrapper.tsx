'use client'

import { useContext, useState } from 'react'

import { get, isNil, keys, omit, omitBy, reduce, reverse } from 'lodash'
import { useSnackbar } from 'notistack'

import useGetDashboardData from '@ors/components/manage/Blocks/Replenishment/Dashboard/useGetDashboardData'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { api } from '@ors/helpers'
import { useStore } from '@ors/store'

import { scAnnualOptions } from '../StatusOfContribution/utils'
import StatusOfTheFundView from '../StatusOfTheFund/StatusOfTheFundView'
import { allocationsOrder } from './constants'
import EditAllocationsDialog from './editDialogs/EditAllocationsDialog'
import EditInterestEarnedDialog from './editDialogs/EditInterestEarnedDialog'
import EditMiscellaneousIncomeDialog from './editDialogs/EditMiscellaneousIncomeDialog'
import EditMonitoringFeesDialog from './editDialogs/EditMonitoringFeesDialog'
import EditStaffContractsDialog from './editDialogs/EditStaffContractsDialog'
import EditTreasuryFeesDialog from './editDialogs/EditTreasuryFeesDialog'

function StatusOfTheFundWrapper() {
  const { invalidateDataFn, newData } = useGetDashboardData()
  const ctx = useContext(ReplenishmentContext)
  const { allocations, asOfDate, income, overview, provisions } = newData

  const projectSlice = useStore((state) => state.projects)
  const meetings = projectSlice.meetings.data
  const formattedMeetings = meetings?.map((meeting: any) => ({
    label: meeting.number,
    value: meeting.id,
  }))
  const meetingOptions = reverse(formattedMeetings)

  const agencies = omit(allocations, 'total')
  const agencyOptions = keys(agencies).map((agency: any) => {
    const agencyName = get(agencies, agency).label

    return {
      id: agency,
      label: agencyName,
      value: agencyName,
    }
  })

  const yearOptions = scAnnualOptions(ctx.periods)

  const [editingSection, setEditingSection] = useState<null | string>(null)

  const { enqueueSnackbar } = useSnackbar()

  function handleEditCancel() {
    setEditingSection(null)
  }

  const getFieldTotal = (formData: any, field: string) =>
    reduce(
      formData,
      (acc, value, key) => {
        return acc + (key.startsWith(field) && !!value ? parseFloat(value) : 0)
      },
      0,
    )

  const handleSubmitEditDialog = (formData: any, field: string) => {
    const apiUrl = `api/replenishment/${field}/`

    let formattedData = { ...formData }

    const staffContractsTotal = getFieldTotal(formData, 'staff_contracts')
    const treasuryFeesTotal = getFieldTotal(formData, 'treasury_fees')
    const monitoringFeesTotal = getFieldTotal(formData, 'monitoring_fees')

    keys(formData).map((key) => {
      const value = get(formData, key)

      formattedData = {
        ...formattedData,
        [key]: !!value
          ? ['meeting_id', 'quarter', 'year'].includes(key)
            ? parseFloat(value)
            : value
          : null,
        ...(staffContractsTotal && {
          ['staff_contracts']: staffContractsTotal.toString(),
        }),
        ...(treasuryFeesTotal && {
          ['treasury_fees']: treasuryFeesTotal.toString(),
        }),
        ...(monitoringFeesTotal && {
          ['monitoring_fees']: monitoringFeesTotal.toString(),
        }),
      }
    })

    const cleanData = omitBy(formattedData, isNil)

    api(apiUrl, {
      data: cleanData,
      method: 'POST',
    })
      .then(() => {
        invalidateDataFn({
          cache_bust: crypto.randomUUID(),
        })
        enqueueSnackbar('Data updated successfully', { variant: 'success' })
        handleEditCancel()
      })
      .catch(() => {
        enqueueSnackbar('Failed to update data', { variant: 'error' })
      })
  }

  const editableFields = [
    ...allocationsOrder.map((allocation) => ({
      component: (
        <EditAllocationsDialog
          {...{
            agencyOptions,
            allocations,
            handleSubmitEditDialog,
            meetingOptions,
            yearOptions,
          }}
          agency={allocation}
          onCancel={handleEditCancel}
        />
      ),
      label: allocation,
    })),
    {
      component: (
        <EditInterestEarnedDialog
          {...{
            agencyOptions,
            allocations,
            handleSubmitEditDialog,
            meetingOptions,
            yearOptions,
          }}
          onCancel={handleEditCancel}
        />
      ),
      label: 'interest_earned',
    },
    {
      component: (
        <EditMiscellaneousIncomeDialog
          {...{
            agencyOptions,
            allocations,
            handleSubmitEditDialog,
            meetingOptions,
            yearOptions,
          }}
          onCancel={handleEditCancel}
        />
      ),
      label: 'miscellaneous_income',
    },
    {
      component: (
        <EditStaffContractsDialog
          {...{ handleSubmitEditDialog, meetingOptions, yearOptions }}
          onCancel={handleEditCancel}
        />
      ),
      label: 'staff_contracts',
    },

    {
      component: (
        <EditTreasuryFeesDialog
          {...{ handleSubmitEditDialog, meetingOptions, yearOptions }}
          onCancel={handleEditCancel}
        />
      ),
      label: 'treasury_fees',
    },
    {
      component: (
        <EditMonitoringFeesDialog
          {...{ handleSubmitEditDialog, meetingOptions, yearOptions }}
          onCancel={handleEditCancel}
        />
      ),
      label: 'monitoring_fees',
    },
  ]

  const editableFieldsLabels = editableFields.map((field) => field.label)
  const currentEditingSection = editableFields.find(
    (field) => field.label === editingSection,
  )

  return (
    <>
      {currentEditingSection?.component}
      <StatusOfTheFundView
        allocations={allocations}
        asOfDate={asOfDate}
        editableFields={editableFieldsLabels}
        income={income}
        overview={overview}
        provisions={provisions}
        setEditingSection={setEditingSection}
        showEditButton={ctx.isTreasurer}
      />
    </>
  )
}

export default StatusOfTheFundWrapper
