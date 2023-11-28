'use client'
import { IconButton, Typography } from '@mui/material'
import cx from 'classnames'

import AgSkeletonCellRenderer from '@ors/components/manage/AgCellRenderers/AgSkeletonCellRenderer'
import AgTooltipComponent from '@ors/components/manage/AgComponents/AgTooltipComponent'

import { IoInformationCircleOutline } from 'react-icons/io5'

export default function AgTextCellRenderer(props: any) {
  const { footnote, info } = props

  if (props.data.rowType === 'skeleton') {
    return <AgSkeletonCellRenderer {...props} />
  }

  return (
    <AgTooltipComponent {...props}>
      <Typography
        className={cx(props.className, { 'cursor-pointer': footnote })}
        component="span"
        onClick={() => {
          const footnoteEl = document.getElementById(`footnote-${footnote}`)
          if (footnote && footnoteEl) {
            footnoteEl.scrollIntoView()
            footnoteEl.classList.add('text-red-500')
            setTimeout(() => {
              footnoteEl.classList.remove('text-red-500')
            }, 900)
          }
        }}
      >
        {props.value}
        {footnote && <sup>{footnote}</sup>}
        {info && (
          <IconButton
            className={cx('ml-2 p-0', { 'cursor-default': !footnote })}
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
