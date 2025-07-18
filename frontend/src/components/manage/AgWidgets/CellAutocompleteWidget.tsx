'use client'
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import { ICellEditorParams } from 'ag-grid-community'

import AutocompleteWidget, {
  AutocompleteWidgetProps,
} from '@ors/components/manage/Widgets/AutocompleteWidget'
import { KEY_BACKSPACE, KEY_ENTER, KEY_TAB } from '@ors/constants'

function getInput(element: HTMLInputElement) {
  if (element.tagName.toLowerCase() === 'input') {
    return element
  }
  return element.querySelector('input')
}

export const CellAutocompleteWidget = memo(
  forwardRef(
    (
      props: {
        agFormatValue?: (value: any) => any
        getOptions?: (params: ICellEditorParams) => any
        isMultiple?: boolean
        isOptionEqualToValue?: (option: any, value: any) => any
        openOnFocus?: boolean
        freeSolo?: boolean
        showUnselectedOptions?: boolean
      } & AutocompleteWidgetProps &
        ICellEditorParams,
      ref,
    ) => {
      const [value, setValue] = useState(props.value)
      const [inputValue, setInputValue] = useState(props.value)

      const refInput = useRef<HTMLInputElement>(null)
      const isValueSelected = useRef(false)

      // focus on the input
      useEffect(() => {
        // get ref from React component
        const eInput = getInput(refInput.current!)
        if (!eInput) return
        eInput.focus()
        // eslint-disable-next-line
      }, [])

      const isArrowKey = (event: any) => {
        return (
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(
            event.key,
          ) > -1
        )
      }

      const isBackspace = (event: any) => {
        return event.key === KEY_BACKSPACE
      }

      const isSelectAll = (event: any) => {
        return (event.ctrlKey || event.metaKey) && event.key === 'a'
      }

      const finishedEditingPressed = (event: any) => {
        const key = event.key
        return (
          key === KEY_TAB ||
          (key === KEY_ENTER && (event.ctrlKey || event.metaKey))
        )
      }

      const onKeyDown = (event: any) => {
        const key = event.key

        if (finishedEditingPressed(event)) {
          props.stopEditing()
          return
        }

        if (
          isArrowKey(event) ||
          isBackspace(event) ||
          isSelectAll(event) ||
          key === KEY_ENTER
        ) {
          event.stopPropagation()
          return
        }
      }

      /* Component Editor Lifecycle methods */
      useImperativeHandle(ref, () => {
        return {
          // the final value to send to the grid, on completion of editing
          getValue() {
            return props.freeSolo ? inputValue : value
          },

          // Gets called once before editing starts, to give editor a chance to
          // If you return true, then the result of the edit will be ignored.
          isCancelAfterEnd() {
            return false
          },

          // Gets called once when editing is finished (eg if Enter is pressed).
          // cancel the editing before it even starts.
          isCancelBeforeStart() {
            return false
          },
        }
      })

      return (
        <AutocompleteWidget
          Input={props.Input}
          getOptionLabel={props.getOptionLabel}
          groupBy={props.groupBy}
          isOptionEqualToValue={props.isOptionEqualToValue}
          openOnFocus={props.openOnFocus}
          freeSolo={props.freeSolo}
          optionClassname={props.optionClassname}
          optionTextClassname={props.optionTextClassname}
          ref={refInput}
          renderOption={props.renderOption}
          options={
            props.options ||
            props.getOptions?.(props.showUnselectedOptions ? value : props) ||
            []
          }
          {...(props.isMultiple && {
            disableCloseOnSelect: true,
            multiple: true,
            renderTags: () => null,
          })}
          value={value}
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: 0,
              height: '100%',
              width: '100%',
            },
            '& fieldset': { border: 'none' },
            borderRadius: 0,
          }}
          onChange={(_: any, value: any) => {
            isValueSelected.current = true

            const parsedValue = props.agFormatValue?.(value) || value
            setValue(parsedValue)
            setInputValue(parsedValue)
          }}
          {...(props.freeSolo && {
            onInputChange: (_: any, value: any) => {
              if (isValueSelected.current) {
                isValueSelected.current = false
                return
              }

              setInputValue(value)
            },
          })}
          onKeyDown={(event: any) => onKeyDown(event)}
        />
      )
    },
  ),
)

export default CellAutocompleteWidget
