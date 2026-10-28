import { SubmitButton } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'

import { IoTrash } from 'react-icons/io5'
import { FiEdit3 } from 'react-icons/fi'
import { Button } from '@mui/material'
import cx from 'classnames'

export const EditSectionIndicator = () => (
  <div className="inline-flex h-8 items-center gap-2 self-center rounded-full bg-primary px-3 py-1 text-lg text-mlfs-hlYellow">
    <FiEdit3 size={18} />
    <span className="mt-0.5">Edit</span>
  </div>
)

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
