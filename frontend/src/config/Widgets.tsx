import AutocompleteWidget from '@ors/components/manage/Widgets/AutocompleteWidget'
import ChipToggleWidget from '@ors/components/manage/Widgets/ChipToggleWidget'
import PasswordWidget from '@ors/components/manage/Widgets/PasswordWidget'
import RangeWidget from '@ors/components/manage/Widgets/RangeWidget'
import TextWidget from '@ors/components/manage/Widgets/TextWidget'
import TextareaWidget from '@ors/components/manage/Widgets/TextareaWidget'

export interface ByType {
  email?: typeof TextWidget
  password?: typeof PasswordWidget
  text?: typeof TextWidget
  textarea?: typeof TextareaWidget
}

export interface ByWidget {
  autocomplete?: typeof AutocompleteWidget
  chipToggle?: typeof ChipToggleWidget
  range?: typeof RangeWidget
}

export interface WidgetsMapping {
  type: ByType
  widget: ByWidget
}

export type WidgetProps = any
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
