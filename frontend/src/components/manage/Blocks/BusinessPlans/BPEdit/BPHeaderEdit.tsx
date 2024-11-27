import { Button } from '@mui/material'
import { entries, find, indexOf, isEmpty, pick, values } from 'lodash'
import { useParams } from 'wouter'
import { useSnackbar } from 'notistack'

import Link from '@ors/components/ui/Link/Link'
import { api, uploadFiles } from '@ors/helpers'
import { useStore } from '@ors/store'

import BPHeaderView from '../BPHeaderView'
import { tableColumns } from '../constants'
import { BpPathParams } from '../types'
import { useEditLocalStorage } from '../useLocalStorage'

export default function BPHeaderEdit({ business_plan, files, form }: any) {
  const pathParams = useParams<BpPathParams>()
  const { agency, period } = pathParams

  const { setBusinessPlan } = useStore((state) => state.businessPlan)
  const { enqueueSnackbar } = useSnackbar()

  const localStorage = useEditLocalStorage({
    activities: form,
    business_plan: business_plan,
  })

  const { deletedFilesIds = [], newFiles = [] } = files || {}

  const editBP = async () => {
    try {
      const bpData = pick(business_plan, ['name', 'year_start', 'year_end'])

      const { id, agency, year_end, year_start } = business_plan

      if (newFiles.length > 0) {
        await uploadFiles(
          `api/business-plan/files/?agency_id=${agency.id}&year_start=${year_start}&year_end=${year_end}`,
          newFiles,
        )
      }

      if (deletedFilesIds.length > 0) {
        await api(
          `api/business-plan/files/?agency_id=${agency.id}&year_start=${year_start}&year_end=${year_end}`,
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

      const response = await api(`api/business-plan/${id}/`, {
        data: {
          activities: form,
          agency_id: agency.id,
          ...bpData,
          status: 'Agency Draft',
        },
        method: 'PUT',
      })

      localStorage.clear()
      enqueueSnackbar(<>Updated submission for {response.name}.</>, {
        variant: 'success',
      })

      setBusinessPlan({
        ...business_plan,
        id: response.id,
      })
    } catch (error) {
      if (error.status === 400) {
        const errors = await error.json()
        if (errors.files) {
          enqueueSnackbar(errors.files, {
            variant: 'error',
          })
        } else {
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
          className="border border-solid border-primary bg-white px-4 py-2 text-primary
          shadow-none hover:bg-primary hover:text-white"
          color="primary"
          href={`/business-plans/${agency}/${period}`}
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
          Update draft
        </Button>
      </div>
    </div>
  )

  return (
    <BPHeaderView
      actions={headerActions}
      titlePrefix={<span className="text-4xl">Editing: </span>}
      viewType="edit"
    />
  )
}
