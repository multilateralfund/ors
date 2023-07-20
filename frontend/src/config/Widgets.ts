import dynamic from 'next/dynamic'

// Widgets mapping
export const widgetMapping: {
  widget: { [key: string]: React.ComponentType }
  type: { [key: string]: React.ComponentType }
} = {
  widget: {
    autocomplete: dynamic(
      () => import('@ors/components/manage/Widgets/AutocompleteWidget'),
    ),
    // filterBoolean: FilterCheckboxWidget,
    // richTextEditor: RichTextEditorWidget
  },
  // choices: SelectWidget,
  type: {
    // boolean: CheckboxWidget,
    // date: DatePickerWidget,
    // datetime: DateTimePickerWidget,
    // password: TextWidget,
    // tel: PhoneNumberWidget
  },
}

// Default Widget
export const defaultWidget = dynamic(
  () => import('@ors/components/manage/Widgets/TextWidget'),
)
