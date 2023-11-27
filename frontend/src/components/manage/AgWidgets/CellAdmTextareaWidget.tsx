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

import { Box, Modal, Typography } from '@mui/material'
import { ICellEditorParams } from 'ag-grid-community'
import { findIndex } from 'lodash'

import TextareaWidget from '@ors/components/manage/Widgets/TextareaWidget'
import { KEY_BACKSPACE, KEY_ENTER, KEY_TAB } from '@ors/constants'
import { applyTransaction } from '@ors/helpers/Utils/Utils'

export const CellAdmTextareaWidget = memo(
  forwardRef(
    (
      props: {
        label?: string
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

      const el = useRef<HTMLTextAreaElement>()

      const [value, setValue] = useState(() => {
        return props.value || adm?.value_text
      })

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
        return key === KEY_TAB || key === KEY_ENTER
      }

      const onKeyDown = (event: any) => {
        if (isArrowKey(event) || isBackspace(event) || isSelectAll(event)) {
          event.stopPropagation()
          return
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

      useEffect(() => {
        setTimeout(() => {
          el.current?.focus()
        }, 0)
      }, [])

      return (
        <>
          <Modal
            className="ag-custom-component-popup"
            aria-labelledby="cell-textarea-widget-title"
            open={true}
            onClose={() => {
              props.stopEditing()
            }}
          >
            <Box className="w-full max-w-md absolute-center">
              <Typography
                id="cell-textarea-widget-title"
                className="mb-4 text-typography-secondary"
                component="h2"
                variant="h6"
              >
                {props.label || 'Add text'}
              </Typography>
              <TextareaWidget
                id="cell-textarea-widget"
                className="mb-4 p-4"
                minRows={5}
                ref={el}
                value={value}
                onChange={(event: any) => {
                  setValue(event.target.value)
                }}
                onKeyDown={(event: any) => onKeyDown(event)}
              />
            </Box>
          </Modal>
        </>
      )
    },
  ),
)

export default CellAdmTextareaWidget
