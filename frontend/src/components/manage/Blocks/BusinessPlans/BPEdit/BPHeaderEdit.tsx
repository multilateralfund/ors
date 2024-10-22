import { Button } from '@mui/material'
import { pick } from 'lodash'
import { useParams } from 'next/navigation'
import { useSnackbar } from 'notistack'

import Link from '@ors/components/ui/Link/Link'
import { api } from '@ors/helpers'

import BPHeaderView from '../BPHeaderView'
import { BpPathParams } from '../types'

export default function BPHeaderEdit({ business_plan, form }: any) {
  const pathParams = useParams<BpPathParams>()
  const { agency, period } = pathParams

  const { enqueueSnackbar } = useSnackbar()

  const editBP = async () => {
    try {
      const bpData = pick(business_plan, ['name', 'year_start', 'year_end'])

      const response = await api(`api/business-plan/${business_plan.id}/`, {
        data: {
          ...bpData,
          activities: form,
          agency_id: business_plan.agency.id,
          status: 'Agency Draft',
        },
        method: 'PUT',
      })

      enqueueSnackbar(<>Updated submission.</>, { variant: 'success' })
    } catch (error) {
      if (error.status === 400) {
        const errors = await error.json()
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
          Save draft
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
