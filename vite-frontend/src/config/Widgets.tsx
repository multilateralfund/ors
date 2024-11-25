import type { AutocompleteWidgetProps } from '@ors/components/manage/Widgets/AutocompleteWidget'
import type { ChipToggleWidgetProps } from '@ors/components/manage/Widgets/ChipToggleWidget'
import type { PasswordWidgetProps } from '@ors/components/manage/Widgets/PasswordWidget'
import type { TextWidgetProps } from '@ors/components/manage/Widgets/TextWidget'
import type { TextareaWidgetProps } from '@ors/components/manage/Widgets/TextareaWidget'
import type { YearRangeWidgetProps } from '@ors/components/manage/Widgets/YearRangeWidget'

import AutocompleteWidget from '@ors/components/manage/Widgets/AutocompleteWidget'
import ChipToggleWidget from '@ors/components/manage/Widgets/ChipToggleWidget'
import PasswordWidget from '@ors/components/manage/Widgets/PasswordWidget'
import TextWidget from '@ors/components/manage/Widgets/TextWidget'
import TextareaWidget from '@ors/components/manage/Widgets/TextareaWidget'
import YearRangeWidget from '@ors/components/manage/Widgets/YearRangeWidget'

export type WidgetProps<T> = {
  FieldProps?: any
  type?: keyof typeof widgetsMapping.type
  widget?: keyof typeof widgetsMapping.widget
} & (
  | ({
      type?: null
      widget?: null
    } & TextWidgetProps)
  | ({ type: 'email' } & TextWidgetProps)
  | ({ type: 'number' } & TextWidgetProps)
  | ({ type: 'password' } & PasswordWidgetProps)
  | ({ type: 'text' } & TextWidgetProps)
  | ({ type: 'textarea' } & TextareaWidgetProps)
  | ({ widget: 'autocomplete' } & AutocompleteWidgetProps<T>)
  | ({ widget: 'chipToggle' } & ChipToggleWidgetProps)
  | ({ widget: 'yearRange' } & YearRangeWidgetProps)
)

// Default Widget
export const defaultWidget = TextWidget

// Widgets mapping
export const widgetsMapping = {
  type: {
    email: defaultWidget,
    number: defaultWidget,
    password: PasswordWidget,
    text: defaultWidget,
    textarea: TextareaWidget,
  },
  widget: {
    autocomplete: AutocompleteWidget,
    chipToggle: ChipToggleWidget,
    yearRange: YearRangeWidget,
  },
}
