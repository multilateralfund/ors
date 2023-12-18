'use client'
import { useMemo } from 'react'

import cx from 'classnames'

import config from '@ors/config'
import { WidgetProps } from '@ors/config/Widgets'

function getWidgetDefault() {
  return config.widgets.default
}

function getWidgetByName(widget?: keyof typeof config.widgets.widget) {
  return widget ? config.widgets.widget[widget] : null
}

function getWidgetByType(type?: keyof typeof config.widgets.type) {
  return type ? config.widgets.type[type] : null
}

export default function Field({
  FieldProps = {},
  type,
  widget,
  ...props
}: WidgetProps): React.ReactNode {
  const Widget = useMemo(
    () =>
      getWidgetByName(widget) || getWidgetByType(type) || getWidgetDefault(),
    [widget, type],
  )

  if (!Widget) {
    return null
  }

  return (
    <div
      {...FieldProps}
      className={cx(
        'widget',
        `${String(widget || type || 'text')}-widget`,
        { 'max-w-full': !FieldProps?.className },
        FieldProps?.className,
      )}
    >
      {/* @ts-ignore */}
      <Widget {...props} />
    </div>
  )
}
