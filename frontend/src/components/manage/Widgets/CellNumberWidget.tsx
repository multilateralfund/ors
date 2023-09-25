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
import { isNumber } from 'lodash'

import { KEY_BACKSPACE, KEY_ENTER, KEY_F2, KEY_TAB } from '@ors/constants'

import TextWidget from '../Widgets/TextWidget'

function getInput(element: HTMLInputElement) {
  if (element.tagName.toLowerCase() === 'input') {
    return element
  }
  return element.querySelector('input')
}

export const CellNumberWidget = memo(
  forwardRef(
    (
      props: {
        max: string
        min: string
      } & ICellEditorParams,
      ref,
    ) => {
      const createInitialState = () => {
        let startValue
        let highlightAllOnFocus = true
        const eventKey = props.eventKey

        if (eventKey === KEY_BACKSPACE) {
          // if backspace or delete pressed, we clear the cell
          startValue = ''
        } else if (eventKey && eventKey.length === 1) {
          // if a letter was pressed, we start with the letter
          startValue = eventKey
          highlightAllOnFocus = false
        } else {
          // otherwise we start with the current value
          startValue = props.value
          if (eventKey === KEY_F2) {
            highlightAllOnFocus = false
          }
        }

        return {
          highlightAllOnFocus,
          value: startValue,
        }
      }

      const initialState = createInitialState()
      const [value, setValue] = useState(initialState.value)
      const [highlightAllOnFocus, setHighlightAllOnFocus] = useState(
        initialState.highlightAllOnFocus,
      )
      const refInput = useRef<HTMLInputElement>(null)

      // focus on the input
      useEffect(() => {
        // get ref from React component
        const eInput = getInput(refInput.current!)
        if (!eInput) return
        eInput.focus()
        if (highlightAllOnFocus) {
          eInput.select()

          setHighlightAllOnFocus(false)
        }
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

      const isCharNumeric = (charStr: string) => {
        return !!/\d/.test(charStr)
      }

      const isCharTheFirstDecimal = (charStr: string, value: string) => {
        return !!/\./.test(charStr) && !/\./.test(value)
      }

      const isNegativeNumber = (charStr: string, value: string) => {
        return !!/\-/.test(charStr) && !value
      }

      const isNumericKey = (event: any) => {
        const value = event.target.value
        const charStr = event.key
        return (
          isCharNumeric(charStr) ||
          isCharTheFirstDecimal(charStr, value) ||
          isNegativeNumber(charStr, value)
        )
      }

      const finishedEditingPressed = (event: any) => {
        const key = event.key
        return key === KEY_ENTER || key === KEY_TAB
      }

      const onKeyDown = (event: any) => {
        if (isArrowKey(event) || isBackspace(event) || isSelectAll(event)) {
          event.stopPropagation()
          return
        }

        if (!finishedEditingPressed(event) && !isNumericKey(event)) {
          if (event.preventDefault) event.preventDefault()
        }

        if (finishedEditingPressed(event)) {
          props.stopEditing()
        }
      }

      /* Component Editor Lifecycle methods */
      useImperativeHandle(ref, () => {
        return {
          // the final value to send to the grid, on completion of editing
          getValue() {
            const finalValue =
              value === '' || value == null ? null : parseFloat(value)
            const min = parseFloat(props.min)
            const max = parseFloat(props.max)
            if (finalValue && isNumber(min) && finalValue < min) return min
            if (finalValue && isNumber(max) && finalValue > max) return max
            return finalValue
          },

          // Gets called once before editing starts, to give editor a chance to
          // If you return true, then the result of the edit will be ignored.
          isCancelAfterEnd() {
            const finalValue = this.getValue()
            return !isNumber(finalValue)
          },

          // Gets called once when editing is finished (eg if Enter is pressed).
          // cancel the editing before it even starts.
          isCancelBeforeStart() {
            return cancelBeforeStart
          },
        }
      })

      return (
        <TextWidget
          ref={refInput}
          type="number"
          value={value}
          InputProps={{
            inputProps: {
              lang: 'en',
              ...(props.min ? { min: props.min } : {}),
              ...(props.max ? { max: props.max } : {}),
              step: 1,
            },
          }}
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: 0,
              height: '100%',
              width: '100%',
            },
            '& fieldset': { border: 'none' },
            borderRadius: 0,
          }}
          onChange={(event: any) => setValue(event.target.value)}
          onKeyDown={(event: any) => onKeyDown(event)}
        />
      )
    },
  ),
)

export default CellNumberWidget
