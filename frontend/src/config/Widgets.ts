import type {
  AutocompleteWidget,
  // AutocompleteWidgetProps,
} from '@ors/components/manage/Widgets/AutocompleteWidget'
import type {
  PasswordWidget,
  // PasswordWidgetProps,
} from '@ors/components/manage/Widgets/PasswordWidget'
import type {
  TextWidget,
  // TextWidgetProps,
} from '@ors/components/manage/Widgets/TextWidget'

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
export type WidgetProps = any
// export type WidgetProps = (
//   | ({ type?: 'email' | 'text' } & TextWidgetProps)
//   | ({ type?: 'password' } & PasswordWidgetProps)
//   | ({ widget?: 'autocomplete' } & AutocompleteWidgetProps)
// ) &
//   (({ type?: string } | { widget?: string }) & TextWidgetProps)

// Widgets mapping
export const widgetsMapping: WidgetsMapping = {
  type: {
    email: dynamic(
      () => import('@ors/components/manage/Widgets/TextWidget'),
    ) as TextWidget,
    password: dynamic(
      () => import('@ors/components/manage/Widgets/PasswordWidget'),
    ) as PasswordWidget,
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
