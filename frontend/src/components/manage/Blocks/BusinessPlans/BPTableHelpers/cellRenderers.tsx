import { ApiEditBPActivity } from '@ors/types/api_bp_get'

import { Dispatch, SetStateAction, useState } from 'react'

import { Tooltip } from '@mui/material'
import { Typography } from '@mui/material'
import { filter, find, findIndex, keys } from 'lodash'

import { IoClose } from 'react-icons/io5'
import CellValidation from '@ors/components/manage/Blocks/BusinessPlans/BPTableHelpers/CellValidation'
import AgCellRenderer from '@ors/components/manage/AgCellRenderers/AgCellRenderer'
import { useStore } from '@ors/store'
import cx from 'classnames'

const Tag = (tags: Array<string>, onDelete: (tag: string) => void) =>
  tags.map((tag: string) => (
    <Typography
      key={tag}
      className="mx-[1px] inline-flex cursor-default items-center gap-0.5 rounded bg-gray-100 px-1 text-xs font-normal"
      component="p"
      variant="h6"
    >
      {tag}
      <button
        className="border-0 bg-transparent p-0 text-gray-500 hover:cursor-pointer hover:text-secondary"
        aria-label="Clear selection"
        tabIndex={-1}
        type="button"
        onFocus={() => onDelete(tag)}
      >
        <IoClose size={16} />
      </button>
    </Typography>
  ))

const updateGridData = (
  tag: string,
  options: Array<any>,
  field: string,
  props: any,
) => {
  const optionId = find(options, (option) => option.name === tag)?.id

  if (field === 'substances') {
    props.data.substances_display = filter(
      props.data.substances_display,
      (tagName) => tagName !== tag,
    )
    props.data.substances = filter(
      props.data.substances,
      (tagId) => tagId !== optionId,
    )
  }
}

const updateFormData = (
  form: Array<ApiEditBPActivity>,
  setForm: Dispatch<SetStateAction<Array<ApiEditBPActivity>>>,
  props: any,
) => {
  const newData = [...form]

  const rowIndex = findIndex(newData, (row) => row.row_id === props.data.row_id)

  if (rowIndex > -1) {
    newData.splice(rowIndex, 1, {
      ...props.data,
    })

    setForm(newData)
  }
}

const TooltipTag = (
  tags: Array<string>,
  setTags: Dispatch<SetStateAction<Array<string>>>,
  params: any,
) => {
  const { field, options, props } = params

  const deleteTag = (tag: string) => {
    updateGridData(tag, options, field, props)
    setTags(filter(tags, (tagName) => tagName !== tag))
  }

  return Tag(tags, deleteTag)
}

const CellTag = (propTags: Array<string>, params: any) => {
  const { field, form, options, props, setForm } = params

  const deleteTag = (tag: string) => {
    updateGridData(tag, options, field, props)
    updateFormData(form, setForm, props)
  }

  return Tag(propTags, deleteTag)
}

const hasErrors = (props: any) => {
  const { rowErrors } = useStore((state) => state.bpErrors)
  const currentErrors = find(
    rowErrors,
    (error) => error.rowIndex === props.data.row_id,
  )

  return currentErrors && keys(currentErrors).includes(props.colDef.field)
}

export const EditTagsCellRenderer = (params: any) => {
  const { field, form, props, setForm } = params
  const { substances_display = [] } = props.data

  const propsTags = field === 'substances' ? substances_display : []

  const [tags, setTags] = useState(propsTags || [])

  const onTooltipClose = () => {
    updateFormData(form, setForm, props)
  }

  return (
    <Tooltip
      TransitionProps={{ timeout: 0 }}
      classes={{ tooltip: 'bp-table-tooltip' }}
      placement={'top'}
      title={tags.length > 0 && TooltipTag(tags, setTags, params)}
      onClose={onTooltipClose}
    >
      <span className="flex items-center">
        <Typography className="diff-cell content-normal" component="span">
          {CellTag(propsTags, params)}
        </Typography>
        {hasErrors(params.props) && <CellValidation {...params.props} />}
      </span>
    </Tooltip>
  )
}

export const editCellRenderer = (
  props: any,
  value: string,
  isLongText?: boolean,
) => {
  const displayError = hasErrors(props)

  return displayError ? (
    <div className="flex justify-between">
      <div
        className={cx({
          'w-full': displayError && !isLongText,
          'w-[90%]': displayError && isLongText,
        })}
      >
        <AgCellRenderer {...props} value={value} />
      </div>
      {displayError && <CellValidation {...props} />}
    </div>
  ) : (
    <AgCellRenderer {...props} value={value} />
  )
}
