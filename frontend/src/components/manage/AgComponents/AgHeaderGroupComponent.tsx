'use client'
import { useContext, useEffect, useState } from 'react'

import { IconButton, Typography } from '@mui/material'
import cx from 'classnames'
import { isString } from 'lodash'
import hash from 'object-hash'

import { FootnotesContext } from '@ors/contexts/Footnote/Footnote'
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

function AgHeaderGroupComponent(props: any) {
  const footnotes = useContext(FootnotesContext)

  const [footnote] = useState(props.footnote)
  const [footnoteId] = useState(
    () =>
      !!footnote &&
      (footnote.id || (footnote.content ? hash(footnote.content) : null)),
  )
  const { displayName } = props

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
        className={cx(props.className, { 'cursor-pointer': !!footnote })}
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
        {displayName}
        {!!footnote && (
          <sup className="font-bold" title={footnote.content}>
            {footnote.index || footnoteId}
          </sup>
        )}
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
      </Typography>
    </AgTooltipComponent>
  )
}

export default AgHeaderGroupComponent
