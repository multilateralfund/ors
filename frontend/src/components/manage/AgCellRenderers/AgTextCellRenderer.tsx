'use client'
import { useContext, useEffect, useState } from 'react'

import { IconButton, Typography } from '@mui/material'
import { CustomCellRendererProps } from 'ag-grid-react'
import cx from 'classnames'
import hash from 'object-hash'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'
import AgTooltipComponent from '@ors/components/manage/AgComponents/AgTooltipComponent'
import { FootnotesContext } from '@ors/contexts/Footnote/Footnote'
import { scrollToElement } from '@ors/helpers/Utils/Utils'

import { IoInformationCircleOutline } from 'react-icons/io5'

export default function AgTextCellRenderer(props: CustomCellRendererProps) {
  const footnotes = useContext(FootnotesContext)

  const [footnote] = useState(props.footnote)
  const [footnoteId] = useState(
    () =>
      !!footnote &&
      (footnote.id || (footnote.content ? hash(footnote.content) : null)),
  )

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
            selectors:
              '#' + CSS.escape(`${footnotes.id}-footnote-${footnoteId}`),
          })
        }}
      >
        {props.value}
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
