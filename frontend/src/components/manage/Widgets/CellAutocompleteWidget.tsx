/* eslint-disable react/display-name */
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import { ICellEditorParams } from 'ag-grid-community'

import { KEY_BACKSPACE, KEY_ENTER, KEY_TAB } from '@ors/constants'

import AutocompleteWidget from '../Widgets/AutocompleteWidget'

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
        options?: Array<any>
      } & ICellEditorParams,
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

      /* Utility Methods */
      const cancelBeforeStart =
        props.eventKey &&
        props.eventKey.length === 1 &&
        '1234567890'.indexOf(props.eventKey) < 0

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
            if (!value) return true
            return false
          },

          // Gets called once when editing is finished (eg if Enter is pressed).
          // cancel the editing before it even starts.
          isCancelBeforeStart() {
            return cancelBeforeStart
          },
        }
      })

      return (
        <AutocompleteWidget
          options={props.options || []}
          ref={refInput}
          value={value}
          onChange={(event: any, value) => {
            setValue(value)
          }}
          onKeyDown={(event: any) => onKeyDown(event)}
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: 0,
              height: '100%',
              width: '100%',
            },
            '& fieldset': { border: 'none' },
            borderRadius: 0,
          }}
        />
      )
    },
  ),
)

export default CellAutocompleteWidget
