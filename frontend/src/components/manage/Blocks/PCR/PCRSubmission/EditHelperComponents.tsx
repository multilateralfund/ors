import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'

import { IoTrash } from 'react-icons/io5'
import { Button } from '@mui/material'
import cx from 'classnames'

export const AddEntityButton = ({
  title,
  action,
  nrEntities,
}: {
  title: string
  action: () => void
  nrEntities: number
}) => (
  <SubmitButton
    title={`+ ${title}`}
    onSubmit={action}
    className={cx(
      'mr-auto h-10 !border-primary !bg-primary !font-normal !text-mlfs-hlYellow',
      { 'mt-4': nrEntities > 0 },
    )}
  />
)

export const DeleteEntityButton = ({
  title,
  onAction,
}: {
  title: string
  onAction: () => void
}) => (
  <Button
    size="small"
    variant="outlined"
    startIcon={<IoTrash size={14} className="mb-0.5" />}
    className="h-8 items-center rounded border-[#e5e7eb] bg-white px-3 py-1 normal-case text-[#8a2323]"
    onClick={onAction}
  >
    {title}
  </Button>
)

export const SubmissionStatus = (status: string) => (
  <div className="mt-4 flex items-center gap-3">
    <span>Submission status:</span>
    <span className="rounded border border-solid border-[#002A3C] px-1 py-0.5 font-medium uppercase leading-tight text-[#002A3C]">
      {status}
    </span>
  </div>
)
