import { Button } from '@mui/material'
import { useParams } from 'next/navigation'

import Link from '@ors/components/ui/Link/Link'

import BPHeaderView from '../BPHeaderView'
import { BpPathParams } from '../types'

export default function BPHeaderEdit() {
  const pathParams = useParams<BpPathParams>()
  const { agency, period } = pathParams

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
