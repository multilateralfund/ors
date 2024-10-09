'use client'
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import { DatePicker } from '@mui/x-date-pickers/DatePicker/DatePicker'
import { ICellEditorParams } from 'ag-grid-community'
import dayjs from 'dayjs'
import { isString } from 'lodash'

import { KEY_ENTER, KEY_TAB } from '@ors/constants'

function getInput(element: HTMLInputElement) {
  if (element.tagName.toLowerCase() === 'input') {
    return element
  }
  return element.querySelector('input')
}

export const CellDateWidget = memo(
  forwardRef(
    (
      props: {
        options?: Array<any>
      } & ICellEditorParams,
      ref,
    ) => {
      const [open, setOpen] = useState(true)
      const [value, setValue] = useState(props.value)
      const refInput = useRef<HTMLInputElement>(null)

      // focus on the input
      useEffect(() => {
        // get ref from React component
        const eInput = getInput(refInput.current!)
        if (!eInput) return
        eInput.focus()
        eInput.addEventListener('keydown', onKeyDown)
        return () => {
          eInput.removeEventListener('keydown', onKeyDown)
        }
        // eslint-disable-next-line
      }, [])

      const finishedEditingPressed = (event: any) => {
        const key = event.key
        return key === KEY_TAB || key === KEY_ENTER
      }

      const onKeyDown = (event: any) => {
        if (finishedEditingPressed(event)) {
          props.stopEditing()
        }
      }

      /* Component Editor Lifecycle methods */
      useImperativeHandle(ref, () => {
        return {
          // the final value to send to the grid, on completion of editing
          getValue() {
            if (!value) return null
            const finalValue = isString(value)
              ? value
              : value.format('YYYY-MM-DD')
            return finalValue !== 'Invalid Date' ? finalValue : null
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

      const minYear = props.context.year >= 2000 ? 2000 : 1990

      return (
        <DatePicker
          format="DD/MM/YYYY"
          minDate={dayjs(`${minYear}-01-01`)}
          /* eslint-disable perfectionist/sort-jsx-props */
          openTo="year"
          open={open}
          /* eslint-enable perfectionist/sort-jsx-props */
          ref={refInput}
          value={value ? dayjs(value) : value}
          slotProps={{
            popper: {
              className: 'ag-custom-component-popup',
            },
          }}
          sx={{
            '& .MuiInputAdornment-root': {
              display: 'none',
            },
            '& .MuiInputBase-root': {
              borderRadius: 0,
              height: '100%',
              width: '100%',
            },
            '& fieldset': { border: 'none' },
            borderRadius: 0,
            width: '100%',
          }}
          onAccept={() => {
            setOpen(false)
          }}
          onChange={(newValue) => {
            setValue(newValue)
          }}
          autoFocus
        />
      )
    },
  ),
)

export default CellDateWidget
