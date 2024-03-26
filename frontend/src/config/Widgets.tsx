import type { AutocompleteWidgetProps } from '@ors/components/manage/Widgets/AutocompleteWidget'
import type { ChipToggleWidgetProps } from '@ors/components/manage/Widgets/ChipToggleWidget'
import type { PasswordWidgetProps } from '@ors/components/manage/Widgets/PasswordWidget'
import type { RangeWidgetProps } from '@ors/components/manage/Widgets/RangeWidget'
import type { TextWidgetProps } from '@ors/components/manage/Widgets/TextWidget'
import type { TextareaWidgetProps } from '@ors/components/manage/Widgets/TextareaWidget'

import AutocompleteWidget from '@ors/components/manage/Widgets/AutocompleteWidget'
import ChipToggleWidget from '@ors/components/manage/Widgets/ChipToggleWidget'
import PasswordWidget from '@ors/components/manage/Widgets/PasswordWidget'
import RangeWidget from '@ors/components/manage/Widgets/RangeWidget'
import TextWidget from '@ors/components/manage/Widgets/TextWidget'
import TextareaWidget from '@ors/components/manage/Widgets/TextareaWidget'

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
  | ({ type: 'password' } & PasswordWidgetProps)
  | ({ type: 'text' } & TextWidgetProps)
  | ({ type: 'textarea' } & TextareaWidgetProps)
  | ({ widget: 'autocomplete' } & AutocompleteWidgetProps<T>)
  | ({ widget: 'chipToggle' } & ChipToggleWidgetProps)
  | ({ widget: 'range' } & RangeWidgetProps)
)

// Default Widget
export const defaultWidget = TextWidget

// Widgets mapping
export const widgetsMapping = {
  type: {
    email: defaultWidget,
    password: PasswordWidget,
    text: defaultWidget,
    textarea: TextareaWidget,
  },
  widget: {
    autocomplete: AutocompleteWidget,
    chipToggle: ChipToggleWidget,
    range: RangeWidget,
  },
}
