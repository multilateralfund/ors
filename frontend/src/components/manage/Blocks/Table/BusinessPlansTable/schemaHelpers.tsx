import { Tooltip, Typography } from '@mui/material'
import cx from 'classnames'
import { isEqual } from 'lodash'

import DiffPill from '@ors/components/ui/DiffUtils/DiffPill'

import BPDiffTooltip from '../../BusinessPlans/BPDiff/BPDiffTooltip'

const formatSimpleVals = (value: any, colIdentifier: string) => {
  if (colIdentifier === 'is_multi_year') {
    return value ? 'M' : 'I'
  }

  if (colIdentifier === 'substances_display') {
    return value ?? []
  }

  return value ?? ''
}

const formatObjectVals = (value: any, colIdentifier: string) => {
  return ['bp_chemical_type', 'country'].includes(colIdentifier)
    ? value?.['name']
    : value?.['code']
}

export const cellValueGetter = (params: any, colIdentifier: string) => {
  const currentCellData = params.data

  const change_type = currentCellData.change_type
  const new_val = currentCellData?.[colIdentifier]
  const old_val = currentCellData?.[colIdentifier + '_old']

  const needsExtraTooltip = ['is_multi_year', 'status'].includes(colIdentifier)

  return {
    change_type: change_type,
    new_value: formatSimpleVals(new_val, colIdentifier),
    old_value: formatSimpleVals(old_val, colIdentifier),
    ...(needsExtraTooltip && {
      extraTooltipData: {
        is_multi_year: colIdentifier === 'is_multi_year',
        new_value: currentCellData?.[colIdentifier + '_display'],
        old_value: currentCellData?.[colIdentifier + '_display_old'],
      },
    }),
  }
}

export const objectCellValueGetter = (params: any, colIdentifier: string) => {
  const change_type = params.data.change_type
  const new_val = params.data?.[colIdentifier]
  const old_val = params.data?.[colIdentifier + '_old']

  return {
    change_type: change_type,
    new_value: formatObjectVals(new_val, colIdentifier),
    old_value: formatObjectVals(old_val, colIdentifier),
    ...(!['bp_chemical_type', 'country'].includes(colIdentifier) && {
      extraTooltipData: {
        new_value: new_val?.['name'],
        old_value: old_val?.['name'],
      },
    }),
    ...(colIdentifier === 'country' && {
      display_tag: change_type !== 'changed',
    }),
  }
}

export const textCellRenderer = (props: any) => {
  const { change_type, display_tag, extraTooltipData, new_value, old_value } =
    props.value
  const { is_multi_year } = extraTooltipData || {}

  const tooltipTitle = is_multi_year
    ? extraTooltipData?.['new_value']
    : extraTooltipData?.['new_value'] || new_value

  if (isEqual(new_value, old_value)) {
    return (
      <Tooltip
        TransitionProps={{ timeout: 0 }}
        classes={{ tooltip: 'bp-table-tooltip' }}
        placement={'top'}
        title={tooltipTitle}
        followCursor
      >
        {display_tag ? (
          <div className="diff-tag-container diff-cell">
            <DiffPill {...{ change_type }} />
            <Typography className="text-sm" component="span">
              {new_value}
            </Typography>
          </div>
        ) : (
          <Typography className="diff-cell" component="span">
            {new_value}
          </Typography>
        )}
      </Tooltip>
    )
  }

  return (
    <Tooltip
      TransitionProps={{ timeout: 0 }}
      enterDelay={300}
      placement={'top'}
      title={<BPDiffTooltip {...{ extraTooltipData, new_value, old_value }} />}
    >
      {display_tag ? (
        <div
          className={cx(
            'diff-tag-container diff-cell',
            { 'diff-cell-deleted': change_type === 'deleted' },
            { 'diff-cell-new': change_type !== 'deleted' },
          )}
        >
          <DiffPill {...{ change_type }} />
          <Typography className="text-sm" component="span">
            {new_value || '-'}
          </Typography>
        </div>
      ) : (
        <Typography
          className={cx(
            'diff-cell',
            { 'diff-cell-deleted': change_type === 'deleted' },
            { 'diff-cell-new': change_type !== 'deleted' },
          )}
          component="span"
        >
          {new_value || '-'}
        </Typography>
      )}
    </Tooltip>
  )
}

const Tag = (tag: string, index: number, classes?: string) => (
  <Typography
    key={index}
    className={cx(
      'mx-[1px] inline-flex cursor-default items-center gap-2 rounded bg-gray-100 px-1 text-xs font-normal',
      classes,
    )}
    component="p"
    variant="h6"
  >
    {tag}
  </Typography>
)

export const displayTagsCellValue = (tags: Array<string>) => (
  <Tooltip
    TransitionProps={{ timeout: 0 }}
    classes={{ tooltip: 'bp-table-tooltip' }}
    placement={'top'}
    title={
      tags?.length > 0 &&
      tags.map((tag: string, index: number) => Tag(tag, index))
    }
    followCursor
  >
    <Typography className="diff-cell content-normal" component="span">
      {tags?.map((tag: string, index: number) => Tag(tag, index))}
    </Typography>
  </Tooltip>
)

export const tagsCellRenderer = (props: any) => {
  const tags = props.value || []

  return displayTagsCellValue(tags)
}

export const substancesDiffCellRenderer = (props: any) => {
  const { change_type, new_value, old_value } = props.value

  return isEqual(new_value, old_value) ? (
    displayTagsCellValue(new_value)
  ) : (
    <Tooltip
      TransitionProps={{ timeout: 0 }}
      enterDelay={300}
      placement={'top'}
      title={<BPDiffTooltip {...{ new_value, old_value }} />}
    >
      <Typography
        className={cx(
          'diff-cell content-normal',
          { 'diff-cell-deleted': change_type === 'deleted' },
          { 'diff-cell-new': change_type !== 'deleted' },
        )}
        component="span"
      >
        {new_value?.length > 0
          ? new_value.map((substance: string, index: number) =>
              Tag(substance, index, 'text-primary'),
            )
          : '-'}
      </Typography>
    </Tooltip>
  )
}

export const numberCellGetter = (params: any, colIdentifier: string) => {
  const change_type = params.data.change_type
  const new_val = params.data?.[colIdentifier]
  const old_val = params.data?.[colIdentifier + '_old']

  return {
    change_type: change_type,
    new_value: new_val ? parseFloat(new_val).toFixed(2) : '-',
    old_value: old_val ? parseFloat(old_val).toFixed(2) : '-',
  }
}

export const numberCellRenderer = (props: any) => {
  const { change_type, new_value, old_value } = props.value

  return new_value === old_value ? (
    <Typography className="diff-cell" component="span">
      <span className="number-cell-val">
        {new_value === '-' ? '' : new_value}
      </span>
    </Typography>
  ) : (
    <Tooltip
      TransitionProps={{ timeout: 0 }}
      enterDelay={300}
      placement={'top'}
      title={<BPDiffTooltip {...{ new_value, old_value }} />}
    >
      <div
        className={cx(
          'diff-cell flex flex-col items-center justify-center gap-1',
          { 'diff-cell-deleted': change_type === 'deleted' },
          { 'diff-cell-new': change_type !== 'deleted' },
        )}
      >
        <Typography className="number-cell-val" component="span">
          {new_value}
        </Typography>
        <Typography
          className={cx(
            'number-cell-val',
            { 'text-gray-400': change_type === 'deleted' },
            { 'text-gray-300': change_type !== 'deleted' },
          )}
          component="span"
        >
          {old_value}
        </Typography>
      </div>
    </Tooltip>
  )
}
