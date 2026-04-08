import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { IoClipboardOutline, IoHourglassOutline } from 'react-icons/io5'
import { readPastedTableFromNavigator } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/pasteSupport'
import { APRTableColumn } from '@ors/components/manage/Blocks/AnnualProgressReport/schema'
import { find } from 'lodash'

function cleanValue(value: string) {
  const toParse = value.trim().split('$').reverse()[0].trim()
  const isNumber = !isNaN(parseFloat(toParse))
  if (isNumber) {
    const decimalSeparator = Intl.NumberFormat(navigator.language)
      .format(1.1)
      .replaceAll('1', '')
    const thousandSeparator = Intl.NumberFormat(navigator.language)
      .format(1111)
      .replaceAll('1', '')
    return toParse
      .replaceAll(thousandSeparator, '')
      .replace(decimalSeparator, '.')
  }
  return value
}
interface BasePasteWrapperProps {
  label: string
  mutator: (row: any, value: any, field?: string) => void
  form: any[] | undefined
  setForm: (state: any[]) => void
  rowIdField?: string
  // activitiesRef: any
  isMultiple?: boolean
  columns?: APRTableColumn[]
}
export function BasePasteWrapper(props: BasePasteWrapperProps) {
  const {
    label,
    mutator,
    form,
    setForm,
    rowIdField = 'display_internal_id',
    isMultiple = false,
    columns,
  } = props
  const { enqueueSnackbar } = useSnackbar()
  const [pasting, setPasting] = useState(false)

  async function handlePaste() {
    setPasting(true)
    const pastedTable = await readPastedTableFromNavigator(
      enqueueSnackbar,
      isMultiple,
    )

    const newValues: Record<string, any> = {}
    for (let i = 0; i < pastedTable.length; i++) {
      const row = pastedTable[i]
      const entryId = row[0]
      if (entryId) {
        newValues[entryId] = row.slice(1)
      }
    }
    let pendingIds = Array.from(Object.keys(newValues))
    const numEntries = pendingIds.length
    let numInserted = 0
    let numColsInserted = 0
    if (numEntries > 0) {
      const nextForm = [...form!]
      for (let i = 0; i < nextForm.length && pendingIds.length; i++) {
        const rowId = nextForm[i][rowIdField]
        if (pendingIds.includes(rowId)) {
          newValues[rowId].map((value: any, index: number) => {
            if (isMultiple) {
              const columnsLabels = newValues[pendingIds[0]]
              const pastedFieldObj = find(columns, (col) => col.label === label)
              const crtFieldObj = find(
                columns,
                (col) => col.label === columnsLabels[index],
              )

              if (
                !(
                  columnsLabels.includes(label) &&
                  crtFieldObj &&
                  crtFieldObj.input &&
                  crtFieldObj.group === pastedFieldObj?.group
                )
              ) {
                return
              }

              mutator(nextForm[i], cleanValue(value), crtFieldObj.fieldName)
              numColsInserted++
            } else {
              mutator(nextForm[i], cleanValue(value))
            }
          })

          pendingIds = pendingIds.filter((v) => v != rowId)
          numInserted++
        }
      }
      setPasting(false)
      setForm(nextForm)
      console.debug('pendingIds', pendingIds)
      console.debug('newValues', newValues)
      if (numInserted > 0) {
        const successMessage = isMultiple
          ? `Successfully pasted ${Math.round(numColsInserted / numInserted)} columns for ${numInserted} entries.`
          : `Successfully pasted ${numInserted}/${numEntries} entries.`

        enqueueSnackbar(successMessage, {
          variant: 'success',
        })
      } else if (pendingIds.length > numInserted) {
        enqueueSnackbar(
          `No valid entries found in pasted data! Make sure you are pasting a ${isMultiple ? 'minimum' : ''} 2 column table.`,
          {
            variant: 'error',
          },
        )
      }
    } else {
      setPasting(false)
    }
  }

  return (
    <span
      className="flex h-full w-full items-center justify-center gap-x-2 hover:text-red-500"
      title="Click for paste."
      onClick={pasting ? () => {} : handlePaste}
    >
      <span>{label}</span>
      <div>{pasting ? <IoHourglassOutline /> : <IoClipboardOutline />}</div>
    </span>
  )
}
