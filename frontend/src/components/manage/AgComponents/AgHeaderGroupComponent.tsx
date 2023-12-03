'use client'
import { IconButton, Typography } from '@mui/material'
import cx from 'classnames'
import { isString } from 'lodash'

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

export default function AgHeaderGroupComponent(props: any) {
  const { displayName, footnote, info } = props

  return (
    <AgTooltipComponent
      {...props}
      colDef={{ ...props.colDef, tooltip: props.tooltip }}
      placement="top"
      value={getTooltipTitle(props)}
    >
      <Typography
        className={cx(props.className, { 'cursor-pointer': footnote })}
        component="span"
        onClick={() => {
          if (!footnote) return
          scrollToElement(`#footnote-${footnote}`, () => {
            const footnoteEl = document.getElementById(`footnote-${footnote}`)
            if (!footnoteEl) return
            footnoteEl.classList.add('text-red-500')
            setTimeout(() => {
              footnoteEl.classList.remove('text-red-500')
            }, 900)
          })
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
