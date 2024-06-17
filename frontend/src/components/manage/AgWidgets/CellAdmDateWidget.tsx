'use client'
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import { DatePicker } from '@mui/x-date-pickers/DatePicker/DatePicker'
import { ICellEditorParams } from 'ag-grid-community'
import dayjs from 'dayjs'
import { findIndex, isString } from 'lodash'

import { KEY_ENTER, KEY_TAB } from '@ors/constants'
import { applyTransaction } from '@ors/helpers/Utils/Utils'

function getInput(element: HTMLInputElement) {
  if (element.tagName.toLowerCase() === 'input') {
    return element
  }
  return element.querySelector('input')
}

export const CellAdmDateWidget = memo(
  forwardRef(
    (
      props: {
        options?: Array<any>
      } & ICellEditorParams,
      ref,
    ) => {
      const columnId = props.colDef.id

      const [adm, admIndex] = useMemo(() => {
        const adms = props.data.values || []
        const index = findIndex(
          adms,
          (item: any) => item.column_id === columnId,
        )
        if (index > -1) {
          return [adms[index], index]
        }
        return [null, -1]
      }, [columnId, props.data.values])

      const [value, setValue] = useState(() => {
        return props.value || adm?.value_text
      })

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
            if (finalValue === 'Invalid Date') return null

            const rowNode = props.api.getRowNode(props.data.row_id)
            const newAdms = [...(props.data.values || [])]

            if (admIndex > -1) {
              newAdms.splice(admIndex, 1, {
                ...adm,
                value_text: value,
              })
            } else {
              newAdms.push({
                column_id: columnId,
                value_text: value,
              })
            }

            applyTransaction(props.api, {
              update: [{ ...props.data, values: newAdms }],
            })

            props.api.flashCells({
              rowNodes: [...(rowNode ? [rowNode] : [])],
            })

            return finalValue
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
          ref={refInput}
          value={dayjs(`${props.context.year}-01-01`)}
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
          onChange={(value) => {
            setValue(value)
          }}
          autoFocus
        />
      )
    },
  ),
)

export default CellAdmDateWidget
