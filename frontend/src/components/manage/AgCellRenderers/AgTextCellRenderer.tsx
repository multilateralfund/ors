'use client'
import { useEffect, useState } from 'react'

import { IconButton, Typography } from '@mui/material'
import cx from 'classnames'
import hash from 'object-hash'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'
import AgTooltipComponent from '@ors/components/manage/AgComponents/AgTooltipComponent'
import { scrollToElement } from '@ors/helpers/Utils/Utils'
import { useStore } from '@ors/store'

import { IoInformationCircleOutline } from 'react-icons/io5'

export default function AgTextCellRenderer(props: any) {
  const [addNote] = useStore((state) => [state.footnotes.addNote])
  const [footnote] = useState(props.footnote)
  const [footnoteId] = useState(
    () =>
      !!footnote &&
      (footnote.id || (footnote.content ? hash(footnote.content) : null)),
  )

  useEffect(() => {
    if (!footnote || !footnoteId) return
    addNote({
      id: footnoteId,
      content: footnote.content,
      index: footnote.index,
      order: footnote.order,
    })
  }, [addNote, footnote, footnoteId])

  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  return (
    <AgTooltipComponent {...props}>
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
        {props.value}
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
      </Typography>
    </AgTooltipComponent>
  )
}
