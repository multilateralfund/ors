'use client'
import type { ByType, ByWidget, WidgetProps } from '@ors/config/Widgets'

import { useMemo } from 'react'

import cx from 'classnames'

import config from '@ors/config'

export type Field =
  | (typeof config.widgets.type)[keyof typeof config.widgets.type]
  | (typeof config.widgets.widget)[keyof typeof config.widgets.widget]
  | null
  | typeof config.widgets.default

function getWidgetDefault() {
  return config.widgets.default
}

function getWidgetByName(widget?: keyof ByWidget) {
  return widget ? config.widgets.widget[widget] : null
}

function getWidgetByType(type?: keyof ByType) {
  return type ? config.widgets.type[type] : null
}

export default function Field({
  FieldProps = {},
  type,
  widget,
  ...props
}: WidgetProps): React.ReactElement {
  const Widget = useMemo(
    () =>
      getWidgetByName(widget) || getWidgetByType(type) || getWidgetDefault(),
    [widget, type],
  )

  return (
    <div
      {...FieldProps}
      className={cx(
        'widget',
        `${widget || type || 'text'}-widget`,
        { 'max-w-full': !FieldProps?.className },
        FieldProps?.className,
      )}
    >
      <Widget {...props} />
    </div>
  )
}
