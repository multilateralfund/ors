'use client'
import { ReactNode, useContext, useEffect, useState } from 'react'

import { IconButton, Typography } from '@mui/material'
import { ColDef, IHeaderParams } from 'ag-grid-community'
import cx from 'classnames'
import { isString } from 'lodash'
import hash from 'object-hash'

import { FootnotesContext, Note } from '@ors/contexts/Footnote/Footnote'
import { scrollToElement } from '@ors/helpers/Utils/Utils'

import AgTooltipComponent from './AgTooltipComponent'

import { IoInformationCircleOutline } from 'react-icons/io5'

function getTooltipTitle(props: any) {
  const { displayName, tooltip } = props
  if (tooltip && isString(tooltip)) {
    return tooltip
  }
  return displayName
}

const getOtherUsesRemarksDisplayName = (displayName: string) => {
  const index = displayName.indexOf('or')

  if (index === -1) {
    return [displayName, '']
  }

  const firstDisplayName = displayName.slice(0, index).trim()
  const secondDisplayName = displayName.slice(index).trim()

  return [firstDisplayName, secondDisplayName]
}

export interface IAgHeaderParams extends IHeaderParams {
  className?: string
  colDef: ColDef
  details: ReactNode
  footnote?: { icon?: boolean } & Note
  tooltip: boolean | string
}

export default function AgHeaderComponent(props: IAgHeaderParams) {
  const footnotes = useContext(FootnotesContext)

  const [footnote] = useState(props.footnote)
  const [footnoteId] = useState(
    () =>
      !!footnote &&
      (footnote.id || (footnote.content ? hash(footnote.content) : null)),
  )
  const { details, displayName } = props

  const colId = props.column?.getColId()
  const isOtherUsesRemarks = colId === 'other_uses_remarks'
  const formattedDisplayName = isOtherUsesRemarks
    ? getOtherUsesRemarksDisplayName(displayName)
    : displayName

  useEffect(() => {
    if (!footnotes || !footnote || !footnoteId) {
      return
    }
    footnotes.addNote({
      id: footnoteId,
      content: footnote.content,
      index: footnote.index,
      order: footnote.order,
    })
  }, [footnotes, footnote, footnoteId])

  return (
    <AgTooltipComponent
      {...props}
      colDef={{ ...props.colDef, tooltip: props.tooltip }}
      placement="top"
      value={getTooltipTitle(props)}
    >
      <Typography
        className={cx(props.className, {
          'cursor-pointer font-bold': !!footnote,
        })}
        component="span"
        onClick={() => {
          if (!footnote) return
          scrollToElement({
            callback: (footnoteEl) => {
              footnoteEl.classList.add('text-red-500')
              setTimeout(() => {
                footnoteEl.classList.remove('text-red-500')
              }, 900)
            },
            selectors:
              '#' + CSS.escape(`${footnotes.id}-footnote-${footnoteId}`),
          })
        }}
      >
        {isOtherUsesRemarks ? formattedDisplayName[0] : formattedDisplayName}
        {!!footnote && (
          <sup className="font-bold" title={footnote.content}>
            {footnote.index || footnoteId}
          </sup>
        )}
        {isOtherUsesRemarks && ` ${formattedDisplayName[1]}`}
        {!!footnote?.icon && (
          <IconButton
            className={cx('ml-1 p-0', { 'cursor-default': !footnote })}
            color="info"
            title={footnote.content}
            disableRipple
          >
            <IoInformationCircleOutline className="inline-block" />
          </IconButton>
        )}
        {details}
      </Typography>
    </AgTooltipComponent>
  )
}
