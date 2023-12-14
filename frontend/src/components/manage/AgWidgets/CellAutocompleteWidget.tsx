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
      props: AutocompleteWidgetProps &
        ICellEditorParams & {
          formatValue?: (value: any) => any
          getOptions?: (params: ICellEditorParams) => any
        },
      ref,
    ) => {
      const [value, setValue] = useState(props.value)
      const refInput = useRef<HTMLInputElement>(null)

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
            return value
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
          options={props.options || props.getOptions?.(props) || []}
          ref={refInput}
          renderOption={props.renderOption}
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
          onChange={(event: any, value: any) => {
            const parsedValue = props.formatValue?.(value) || value
            setValue(parsedValue)
          }}
          onKeyDown={(event: any) => onKeyDown(event)}
        />
      )
    },
  ),
)

export default CellAutocompleteWidget
