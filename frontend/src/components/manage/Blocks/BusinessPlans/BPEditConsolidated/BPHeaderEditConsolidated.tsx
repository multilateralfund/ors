import { Button } from '@mui/material'
import { capitalize, entries, find, indexOf, isEmpty, values } from 'lodash'
import { useParams } from 'wouter'
import { useSnackbar } from 'notistack'

import Link from '@ors/components/ui/Link/Link'
import { api } from '@ors/helpers'

import { tableColumns } from '../constants'
import { BpPathParams } from '../types'
import { useEditLocalStorageConsolidated } from './useLocalStorageConsolidated'
import { useStore } from '@ors/store'

export default function BPHeaderEditConsolidated({
  form,
  setWarnOnClose,
  type,
  results,
  bpForm,
}: any) {
  const { period } = useParams<BpPathParams>()
  const [year_start, year_end] = period.split('-')

  const { setBusinessPlan } = useStore((state) => state.businessPlan)

  const { enqueueSnackbar } = useSnackbar()

  const localStorage = useEditLocalStorageConsolidated(form, type, period)

  const editBP = async () => {
    try {
      const response = await api(`api/business-plan/${results[0].id}/`, {
        data: {
          activities: form,
          year_start: parseInt(year_start),
          year_end: parseInt(year_end),
          status: capitalize(type),
          meeting: bpForm.meeting,
          decision: bpForm.decision,
        },
        method: 'PUT',
      })

      localStorage.clear()
      setWarnOnClose(false)

      enqueueSnackbar(
        <>
          Updated {type} data for {year_start}-{year_end}.
        </>,
        {
          variant: 'success',
        },
      )
      setBusinessPlan({
        ...results[0],
        id: response.id,
      })
    } catch (error) {
      if (error.status === 400) {
        //   const errors = await error.json()
        //   const firstDataError = find(errors.activities, (err) => !isEmpty(err))
        //   const index = indexOf(errors.activities, firstDataError)

        //   if (firstDataError) {
        //     enqueueSnackbar(
        //       <div className="flex flex-col">
        //         Row {index + 1}
        //         {entries(firstDataError).map((error) => {
        //           const headerName = tableColumns[error[0]]
        //           const errorMessage = (error[1] as Array<string>)[0]

        //           return ['project_type_code', 'sector_code'].includes(
        //             error[0],
        //           ) ? null : headerName ? (
        //             <div key={error[0]}>
        //               {headerName} - {errorMessage}
        //             </div>
        //           ) : (
        //             <>{errorMessage}</>
        //           )
        //         })}
        //       </div>,
        //       {
        //         variant: 'error',
        //       },
        //     )
        //   } else {
        //     enqueueSnackbar(<>{values(errors)[0]}</>, {
        //       variant: 'error',
        //     })
        //   }
        enqueueSnackbar(<>Please make sure all the inputs are correct.</>, {
          variant: 'error',
        })
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
          href={`/business-plans/list/activities/${period}`}
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
          onClick={editBP}
        >
          Save
        </Button>
      </div>
    </div>
  )

  return (
    <div className="mb-4 flex min-h-[40px] flex-wrap items-center justify-between gap-x-8 gap-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-2">
          <h1 className="m-0 text-5xl leading-normal">
            Edit Business Plan {period} {capitalize(type)}
          </h1>
        </div>
      </div>
      <div className="ml-auto">{headerActions}</div>
    </div>
  )
}
