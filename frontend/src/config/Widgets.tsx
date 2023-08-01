import type { AutocompleteWidget } from '@ors/components/manage/Widgets/AutocompleteWidget'
import type { ChipToggleWidget } from '@ors/components/manage/Widgets/ChipToggleWidget'
import type { PasswordWidget } from '@ors/components/manage/Widgets/PasswordWidget'
import type { TextWidget } from '@ors/components/manage/Widgets/TextWidget'

import dynamic from 'next/dynamic'

import TextWidgetLoading from '@ors/components/theme/Loading/TextWidgetLoading'

export interface ByType {
  email?: TextWidget
  password?: TextWidget
  text?: TextWidget
}

export interface ByWidget {
  autocomplete?: AutocompleteWidget
  chipToggle?: ChipToggleWidget
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

// Default Widget
export const defaultWidget = dynamic(
  () => import('@ors/components/manage/Widgets/TextWidget'),
  {
    loading: () => <TextWidgetLoading />,
  },
) as TextWidget

// Widgets mapping
export const widgetsMapping: WidgetsMapping = {
  type: {
    email: defaultWidget,
    password: dynamic(
      () => import('@ors/components/manage/Widgets/PasswordWidget'),
      {
        loading: () => <TextWidgetLoading />,
      },
    ) as PasswordWidget,
    text: defaultWidget,
  },
  widget: {
    autocomplete: dynamic(
      () => import('@ors/components/manage/Widgets/AutocompleteWidget'),
      {
        loading: () => <TextWidgetLoading />,
      },
    ) as AutocompleteWidget,
    chipToggle: dynamic(
      () => import('@ors/components/manage/Widgets/ChipToggleWidget'),
      {
        loading: () => <TextWidgetLoading />,
      },
    ) as ChipToggleWidget,
  },
}
