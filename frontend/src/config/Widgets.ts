import type { AutocompleteWidget } from '@ors/components/manage/Widgets/AutocompleteWidget'
import type { TextWidget } from '@ors/components/manage/Widgets/TextWidget'

import dynamic from 'next/dynamic'

export interface ByType {
  email?: TextWidget
  password?: TextWidget
  text?: TextWidget
}

export interface ByWidget {
  autocomplete?: AutocompleteWidget
}

export interface WidgetsMapping {
  type: ByType
  widget: ByWidget
}

export type BaseWidgetProps = {
  type?: keyof ByType
  widget?: keyof ByWidget
}

// TODO: Find a way to pass combined types. For now let's use any
export type WidgetProps = BaseWidgetProps & any

// Widgets mapping
export const widgetsMapping: WidgetsMapping = {
  type: {
    email: dynamic(
      () => import('@ors/components/manage/Widgets/TextWidget'),
    ) as TextWidget,
    password: dynamic(
      () => import('@ors/components/manage/Widgets/PasswordWidget'),
    ) as TextWidget,
    text: dynamic(
      () => import('@ors/components/manage/Widgets/TextWidget'),
    ) as TextWidget,
  },
  widget: {
    autocomplete: dynamic(
      () => import('@ors/components/manage/Widgets/AutocompleteWidget'),
    ) as AutocompleteWidget,
  },
}

// Default Widget
export const defaultWidget = dynamic(
  () => import('@ors/components/manage/Widgets/TextWidget'),
) as TextWidget
