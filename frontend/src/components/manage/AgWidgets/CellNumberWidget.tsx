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
import { isNaN, isNumber } from 'lodash'

import { KEY_BACKSPACE, KEY_F2 } from '@ors/constants'
import { parseNumber } from '@ors/helpers/Utils/Utils'

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

      /* Component Editor Lifecycle methods */
      useImperativeHandle(ref, () => {
        return {
          // the final value to send to the grid, on completion of editing
          getValue() {
            const finalValue = parseNumber(value) || 0
            const min = parseNumber(props.min)
            const max = parseNumber(props.max)
            if (finalValue && isNumber(min) && finalValue < min) return min
            if (finalValue && isNumber(max) && finalValue > max) return max
            return finalValue
          },

          // Gets called once before editing starts, to give editor a chance to
          // If you return true, then the result of the edit will be ignored.
          isCancelAfterEnd() {
            const finalValue = parseNumber(value)
            return !isNumber(finalValue) || isNaN(finalValue)
          },

          // Gets called once when editing is finished (eg if Enter is pressed).
          // cancel the editing before it even starts.
          isCancelBeforeStart() {
            return false
          },
        }
      })

      return (
        <input
          className="width-full h-full grow border-0 outline-none"
          ref={refInput}
          type="number"
          value={value}
          onChange={(event: any) => setValue(event.target.value)}
        />
      )
    },
  ),
)

export default CellNumberWidget
