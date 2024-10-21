'use client'

import { useContext, useState } from 'react'

import { get, isNil, keys, omit, omitBy, reduce, reverse } from 'lodash'
import { useSnackbar } from 'notistack'

import useGetDashboardData from '@ors/components/manage/Blocks/Replenishment/Dashboard/useGetDashboardData'
import ReplenishmentContext from '@ors/contexts/Replenishment/ReplenishmentContext'
import { api } from '@ors/helpers'
import { useStore } from '@ors/store'

import { encodeFileForUpload } from '../SAView/SAView'
import { scAnnualOptions } from '../StatusOfContribution/utils'
import StatusOfTheFundView from '../StatusOfTheFund/StatusOfTheFundView'
import { allocationsOrder } from './constants'
import EditAllocationsDialog from './editDialogs/EditAllocationsDialog'
import EditInterestEarnedDialog from './editDialogs/EditInterestEarnedDialog'
import EditMiscellaneousIncomeDialog from './editDialogs/EditMiscellaneousIncomeDialog'
import EditSecretariatDialog from './editDialogs/EditSecretariatDialog'
import UploadFilesDialog from './editDialogs/UploadFilesDialog'

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

  const { enqueueSnackbar } = useSnackbar()

  const [editingSection, setEditingSection] = useState<null | string>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const handleCloseUploadDialog = () => setShowUploadDialog(false)

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
            ? parseInt(value)
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

  const handleUploadFiles = async (formData: any) => {
    const entry = Object.fromEntries(formData.entries())
    const meetingId = entry.meeting_id
    const year = entry.year

    entry.meeting_id = !!meetingId ? parseInt(meetingId) : meetingId
    entry.year = !!year ? parseInt(year) : year

    const file = await encodeFileForUpload(entry['file_0'] as File)

    entry['file'] = file
    entry['filename'] = file.filename
    const data = new FormData()

    // keys(entry).map((key) => {
    //   const value = get(entry, key)

    //   if (!key.startsWith('file_') && key !== 'deleted_files') {
    //     if (!isNil(value) && value !== '') {
    //       data.append(key, value)
    //     }
    //   } else if (key.startsWith('file_') && value instanceof File) {
    //     const fileIndex = key.split('_')[1]
    //     console.log(value)
    //   }
    // })

    api('/api/replenishment/status-files/', {
      data: { file: entry.file, filename: entry.filename },
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

    console.log(Object.fromEntries(data.entries()))

    // enqueueSnackbar('Data updated successfully', { variant: 'success' })
    // handleCloseUploadDialog()
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
        <EditSecretariatDialog
          {...{ handleSubmitEditDialog, meetingOptions }}
          field="staff_contracts"
          label="budget"
          title="Budget:"
          onCancel={handleEditCancel}
        />
      ),
      label: 'staff_contracts',
    },

    {
      component: (
        <EditSecretariatDialog
          {...{ handleSubmitEditDialog, meetingOptions }}
          field="treasury_fees"
          label="treasurer fees"
          title="Treasurer fees:"
          onCancel={handleEditCancel}
        />
      ),
      label: 'treasury_fees',
    },
    {
      component: (
        <EditSecretariatDialog
          {...{ handleSubmitEditDialog, meetingOptions }}
          field="monitoring_fees"
          label="evaluation budget"
          title="Evaluation budget:"
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
      {showUploadDialog && (
        <UploadFilesDialog
          {...{
            handleUploadFiles,
            meetingOptions,
            yearOptions,
          }}
          onCancel={handleCloseUploadDialog}
        />
      )}
      {currentEditingSection?.component}
      <StatusOfTheFundView
        allocations={allocations}
        asOfDate={asOfDate}
        editableFields={editableFieldsLabels}
        income={income}
        overview={overview}
        provisions={provisions}
        setEditingSection={setEditingSection}
        setShowUploadDialog={setShowUploadDialog}
        showEditButton={ctx.isTreasurer}
      />
    </>
  )
}

export default StatusOfTheFundWrapper
