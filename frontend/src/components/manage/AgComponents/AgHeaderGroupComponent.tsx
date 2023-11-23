'use client'
import { IconButton, Typography } from '@mui/material'
import cx from 'classnames'

import AgTooltipComponent from './AgTooltipComponent'

import { IoInformationCircleOutline } from 'react-icons/io5'

export default function AgHeaderGroupComponent(props: any) {
  const { displayName, footnote, info } = props

  return (
    <AgTooltipComponent
      {...props}
      colDef={{ ...props.colDef, tooltip: !!info || props.tooltip }}
      placement="top"
      value={info || displayName}
    >
      <Typography
        className={cx(props.className, { 'cursor-pointer': footnote })}
        component="span"
        onClick={() => {
          const footnoteEl = document.getElementById(`footnote-${footnote}`)
          if (footnote && footnoteEl) {
            footnoteEl.scrollIntoView()
          }
        }}
      >
        {displayName}
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
