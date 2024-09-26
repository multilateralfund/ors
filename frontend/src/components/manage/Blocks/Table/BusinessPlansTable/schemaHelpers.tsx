import { Tooltip, Typography } from '@mui/material'
import { isEqual } from 'lodash'

import { truncateText } from '@ors/components/manage/Utils/diffUtils'

import BPDiffTooltipHeader from '../../BusinessPlans/BPDiff/BPDiffTooltipHeader'
import CommentsTagList from './CommentsTagList'

const formatSimpleVals = (value: any, colIdentifier: string) => {
  if (colIdentifier === 'is_multi_year') {
    return value ? 'MYA' : 'IND'
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

  const new_val = currentCellData?.[colIdentifier]
  const old_val = currentCellData?.[colIdentifier + '_old']

  const needsExtraTooltip = ['is_multi_year', 'status'].includes(colIdentifier)

  return {
    new_value: formatSimpleVals(new_val, colIdentifier),
    old_value: formatSimpleVals(old_val, colIdentifier),
    ...(needsExtraTooltip && {
      extraTooltipData: {
        new_value: currentCellData?.[colIdentifier + '_display'],
        old_value: currentCellData?.[colIdentifier + '_display_old'],
      },
    }),
  }
}

export const textCellRenderer = (props: any) => {
  const { extraTooltipData, new_value, old_value } = props.value

  return isEqual(new_value, old_value) ? (
    <Typography className="diff-cell" component="span">
      {new_value}
    </Typography>
  ) : (
    <Tooltip
      enterDelay={300}
      placement={'top'}
      title={
        <BPDiffTooltipHeader {...{ extraTooltipData, new_value, old_value }} />
      }
    >
      <Typography className="diff-cell diff-cell-new" component="span">
        {new_value || '-'}
      </Typography>
    </Tooltip>
  )
}

export const numberCellGetter = (params: any, colIdentifier: string) => {
  const new_val = params.data?.[colIdentifier]
  const old_val = params.data?.[colIdentifier + '_old']

  return {
    new_value: new_val ? parseFloat(new_val).toFixed(2) : '',
    old_value: old_val ? parseFloat(old_val).toFixed(2) : '',
  }
}

export const numberCellRenderer = (props: any) => {
  const { new_value, old_value } = props.value

  return new_value === old_value ? (
    <Typography className="diff-cell" component="span">
      <span className="number-cell-val">{new_value}</span>
    </Typography>
  ) : (
    <Tooltip
      enterDelay={300}
      placement={'top'}
      title={<BPDiffTooltipHeader {...{ new_value, old_value }} />}
    >
      <div className="diff-cell diff-cell-new flex flex-col items-center justify-center gap-1">
        <Typography className="number-cell-val font-semibold" component="span">
          {new_value === '' ? '-' : new_value}
        </Typography>
        <Typography className="number-cell-val text-gray-300" component="span">
          {old_value === '' ? '-' : old_value}
        </Typography>
      </div>
    </Tooltip>
  )
}

const displaySubstanceCellValue = (substances: Array<string>) => (
  <Typography className="diff-cell content-normal" component="span">
    {substances?.map((substance: string, index: number) => (
      <Typography
        key={index}
        className="mx-[1px] inline-flex cursor-default items-center gap-2 rounded bg-gray-100 px-1 text-xs font-normal"
        component="p"
        variant="h6"
      >
        {substance}
      </Typography>
    ))}
  </Typography>
)

export const substancesCellRenderer = (props: any) => {
  const substances = props.value || []

  return displaySubstanceCellValue(substances)
}

export const substancesDiffCellRenderer = (props: any) => {
  const { new_value, old_value } = props.value

  return isEqual(new_value, old_value) ? (
    displaySubstanceCellValue(new_value)
  ) : (
    <Tooltip
      enterDelay={300}
      placement={'top'}
      title={<BPDiffTooltipHeader {...{ new_value, old_value }} />}
    >
      <Typography
        className="diff-cell-new diff-cell content-normal"
        component="span"
      >
        {new_value?.length > 0
          ? new_value.map((substance: string, index: number) => (
              <Typography
                key={index}
                className="mx-[1px] inline-flex items-center gap-2 rounded bg-gray-100 px-1
                text-xs font-normal text-primary"
                component="p"
                variant="h6"
              >
                {substance}
              </Typography>
            ))
          : '-'}
      </Typography>
    </Tooltip>
  )
}

export const objectCellValueGetter = (params: any, colIdentifier: string) => {
  const new_val = params.data?.[colIdentifier]
  const old_val = params.data?.[colIdentifier + '_old']

  return {
    new_value: formatObjectVals(new_val, colIdentifier),
    old_value: formatObjectVals(old_val, colIdentifier),
    ...(!['bp_chemical_type', 'country'].includes(colIdentifier) && {
      extraTooltipData: {
        new_value: new_val?.['name'],
        old_value: old_val?.['name'],
      },
    }),
  }
}

const displayCommentsCellValue = (
  commentSecretariat: string,
  commentTypes: Array<string> = [],
) => (
  <div className="p-0.5 text-left">
    {commentTypes.length > 0 && <CommentsTagList comments={commentTypes} />}
    <Tooltip
      TransitionProps={{ timeout: 0 }}
      classes={{ tooltip: 'bp-table-tooltip' }}
      title={commentSecretariat}
    >
      {(commentSecretariat as any) && truncateText(commentSecretariat, 45)}
    </Tooltip>
  </div>
)

export const commentsCellRenderer = (props: any) => {
  const { commentSecretariat, commentTypes } = props.value

  return displayCommentsCellValue(commentSecretariat, commentTypes)
}

export const commentsDiffCellRenderer = (props: any) => {
  const { new_value, old_value } = props.value

  const { comment: new_comment, comment_types: new_comment_types } =
    new_value || {}
  const { comment: old_comment, comment_types: old_comment_types } =
    old_value || {}

  return isEqual(new_comment, old_comment) &&
    isEqual(new_comment_types, old_comment_types) ? (
    displayCommentsCellValue(new_comment, new_comment_types)
  ) : (
    <Tooltip
      enterDelay={300}
      placement={'top'}
      title={<BPDiffTooltipHeader {...{ new_value, old_value }} />}
    >
      <div className="diff-cell diff-cell-new text-left !leading-4">
        {new_comment || new_comment_types?.length > 0 ? (
          <>
            {new_comment_types?.length > 0 && (
              <CommentsTagList
                comments={new_comment_types}
                withoutTooltip={true}
              />
            )}
            {new_comment && truncateText(new_comment, 45)}
          </>
        ) : (
          <>-</>
        )}
      </div>
    </Tooltip>
  )
}

export const commentsValueGetter = (params: any) => {
  return {
    commentSecretariat: params.data.comment_secretariat,
    commentTypes: params.data.comment_types,
  }
}

export const commentsDiffValueGetter = (params: any) => {
  const new_comment = params.data?.['comment_secretariat']
  const old_comment = params.data?.['comment_secretariat_old']

  const new_comment_types = params.data?.['comment_types']
  const old_comment_types = params.data?.['comment_types_old']

  return {
    new_value: {
      comment: new_comment ?? '',
      comment_types: new_comment_types ?? [],
    },
    old_value: {
      comment: old_comment ?? '',
      comment_types: old_comment_types ?? [],
    },
  }
}
