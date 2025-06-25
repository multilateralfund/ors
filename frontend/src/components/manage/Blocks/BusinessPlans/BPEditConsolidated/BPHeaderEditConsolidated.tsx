import { useContext, useState } from 'react'

import Loading from '@ors/components/theme/Loading/Loading'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import Link from '@ors/components/ui/Link/Link'
import { useEditLocalStorageConsolidated } from './useLocalStorageConsolidated'
import { RedirectToBpList } from '../RedirectToBpList'
import { tableColumns } from '../constants'
import { BpPathParams } from '../types'
import { api, uploadFiles } from '@ors/helpers'
import { useStore } from '@ors/store'

import { capitalize, filter, keys, map, some } from 'lodash'
import { Button } from '@mui/material'
import { useSnackbar } from 'notistack'
import { useParams } from 'wouter'

export default function BPHeaderEditConsolidated({
  form,
  setWarnOnClose,
  type,
  business_plan,
  bpForm,
  files,
  setForm,
  isFirstRender,
}: any) {
  const { period } = useParams<BpPathParams>()
  const [year_start, year_end] = period.split('-')

  const [isSaving, setIsSaving] = useState(false)

  const { setBusinessPlan } = useStore((state) => state.businessPlan)
  const { activeTab } = useStore((state) => state.bp_current_tab)
  const { setRowErrors } = useStore((state) => state.bpErrors)

  const { canUpdateBp } = useContext(PermissionsContext)

  const { enqueueSnackbar } = useSnackbar()

  const localStorage = useEditLocalStorageConsolidated(form, type, period)

  const { deletedFilesIds = [], newFiles = [] } = files || {}

  const editBP = async () => {
    setIsSaving(true)

    const formattedData = map(form, (dataItem, index) => ({
      ...dataItem,
      row_id: form.length - index - 1,
      title: dataItem.title ?? '',
    }))

    try {
      if (newFiles.length > 0) {
        await uploadFiles(
          `api/business-plan/files/?status=${capitalize(type)}&year_start=${year_start}&year_end=${year_end}`,
          newFiles,
        )
      }

      if (deletedFilesIds.length > 0) {
        await api(
          `api/business-plan/files/?status=${capitalize(type)}&year_start=${year_start}&year_end=${year_end}`,
          {
            data: {
              file_ids: deletedFilesIds,
            },
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'DELETE',
          },
        )
      }

      const response = await api(`api/business-plan/${business_plan.id}/`, {
        data: {
          activities: formattedData,
          year_start: parseInt(year_start),
          year_end: parseInt(year_end),
          status: capitalize(type),
          meeting_id: bpForm?.meeting,
          decision_id: bpForm?.decision,
        },
        method: 'PUT',
      })

      isFirstRender.current = false
      localStorage.clear()
      setIsSaving(false)
      setWarnOnClose(false)
      setRowErrors([])

      enqueueSnackbar(
        <>
          Updated {type} data for {year_start}-{year_end}.
        </>,
        {
          variant: 'success',
        },
      )
      setBusinessPlan({
        ...business_plan,
        id: response.id,
      })
    } catch (error) {
      setIsSaving(false)

      if (error.status === 400) {
        const errors = await error.json()
        if (errors?.files) {
          enqueueSnackbar(errors.files, {
            variant: 'error',
          })
        } else {
          const formattedRowErrors = map(errors.activities, (error, index) => ({
            ...error,
            rowIndex: errors.activities.length - index - 1,
          }))
          const filteredRowErrors = filter(
            formattedRowErrors,
            (error) => keys(error).length > 1,
          )

          setForm(formattedData)
          setRowErrors(filteredRowErrors)

          const hasTableColsErrors = some(filteredRowErrors, (error) =>
            some(keys(tableColumns), (key) => keys(error).includes(key)),
          )

          if (errors?.general_error) {
            enqueueSnackbar(<>{errors.general_error}</>, {
              variant: 'error',
            })
          } else {
            enqueueSnackbar(
              <>
                {hasTableColsErrors
                  ? 'Please make sure all the inputs are correct.'
                  : 'An error occurred. Please try again.'}
              </>,
              {
                variant: 'error',
              },
            )
          }
        }
      } else {
        enqueueSnackbar(<>An error occurred. Please try again.</>, {
          variant: 'error',
        })
      }
    }
  }

  const headerActions = (
    <div className="flex items-center">
      <div className="container flex w-full justify-between gap-x-4 px-0">
        <Link
          className="border border-solid border-primary bg-white px-4 py-2 text-primary shadow-none hover:bg-primary hover:text-white"
          color="primary"
          href={`/business-plans/list/${activeTab === 0 ? 'report-info' : 'activities'}/${period}`}
          size="large"
          variant="contained"
          button
        >
          Cancel
        </Link>
        {canUpdateBp && (
          <Button
            className="px-4 py-2 shadow-none hover:text-white"
            size="large"
            variant="contained"
            onClick={editBP}
          >
            Save
          </Button>
        )}
        <Loading
          className="!fixed bg-action-disabledBackground"
          active={isSaving}
        />
      </div>
    </div>
  )

  return (
    <>
      <RedirectToBpList currentYearRange={period} />
      <div className="mb-4 flex min-h-[40px] items-center justify-between gap-x-8 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-2">
            <h1 className="m-0 text-5xl leading-normal">
              Edit Business Plan {period} ({capitalize(type)})
            </h1>
          </div>
        </div>
        <div className="ml-auto">{headerActions}</div>
      </div>
    </>
  )
}
