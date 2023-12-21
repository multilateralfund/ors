'use client'
import { useEffect, useState } from 'react'

import { IconButton, Typography } from '@mui/material'
import cx from 'classnames'
import { isString } from 'lodash'
import hash from 'object-hash'

import { scrollToElement } from '@ors/helpers/Utils/Utils'
import { useStore } from '@ors/store'

import AgTooltipComponent from './AgTooltipComponent'

import { IoInformationCircleOutline } from 'react-icons/io5'

function getTooltipTitle(props: any) {
  const { displayName, tooltip } = props
  if (tooltip && isString(tooltip)) {
    return tooltip
  }
  return displayName
}

export default function AgHeaderComponent(props: any) {
  const [addNote] = useStore((state) => [state.footnotes.addNote])
  const [footnote] = useState(props.footnote)
  const [footnoteId] = useState(
    () =>
      !!footnote &&
      (footnote.id || (footnote.content ? hash(footnote.content) : null)),
  )
  const { details, displayName } = props

  useEffect(() => {
    if (!footnote || !footnoteId) return
    addNote({
      id: footnoteId,
      content: footnote.content,
      index: footnote.index,
      order: footnote.order,
    })
  }, [addNote, footnote, footnoteId])

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
            selectors: `#footnote-${footnoteId}`,
          })
        }}
      >
        {displayName}
        {!!footnote && (
          <sup className="font-bold">{footnote.index || footnoteId}</sup>
        )}
        {!!footnote?.icon && (
          <IconButton
            className={cx('ml-1 p-0', { 'cursor-default': !footnote })}
            color="info"
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
