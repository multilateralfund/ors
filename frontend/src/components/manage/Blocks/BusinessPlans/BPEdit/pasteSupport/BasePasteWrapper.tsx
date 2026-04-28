import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { IoClipboardOutline, IoHourglassOutline } from 'react-icons/io5'
import { readPastedTableFromNavigator } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/pasteSupport'
import { BPEditTableInterface } from '@ors/components/manage/Blocks/BusinessPlans/types.ts'

const decimalSeparator = Intl.NumberFormat(navigator.language)
  .format(1.1)
  .replaceAll('1', '')
const thousandSeparator = Intl.NumberFormat(navigator.language)
  .format(1111)
  .replaceAll('1', '')

function cleanValue(value: string) {
  if (value == null) return value
  const toParse = value.trim().split('$').reverse()[0].trim()
  const isNumber = !isNaN(parseFloat(toParse))
  if (isNumber) {
    return toParse.replaceAll(thousandSeparator, '').replace(decimalSeparator, '.')
  }
  return value
}
interface BasePasteWrapperProps {
  label: string
  mutator: (row: any, value: any) => void
  form: any[] | undefined
  setForm: (state: any[]) => void
  rowIdField?: string
  // activitiesRef: any
}
export function BasePasteWrapper(props: BasePasteWrapperProps) {
  const {
    label,
    mutator,
    form,
    setForm,
    rowIdField = 'display_internal_id',
  } = props
  const { enqueueSnackbar } = useSnackbar()
  const [pasting, setPasting] = useState(false)

  async function handlePaste() {
    setPasting(true)
    try {
      const pastedTable = await readPastedTableFromNavigator(enqueueSnackbar)
      const newValues: Record<string, any> = {}
      for (let i = 0; i < pastedTable.length; i++) {
        const row = pastedTable[i]
        const entryId = row[0]
        if (entryId) {
          newValues[entryId] = row[1]
        }
      }
      const pendingIds = new Set(Object.keys(newValues))
      const numEntries = pendingIds.size
      let numInserted = 0
      if (numEntries === 0) {
        enqueueSnackbar(
          'No project codes found in pasted data! Make sure the first column contains project codes.',
          { variant: 'error' },
        )
        return
      }
      if (numEntries > 0) {
        const nextForm = [...form!]
        for (let i = 0; i < nextForm.length && pendingIds.size; i++) {
          const rowId = nextForm[i][rowIdField]
          if (pendingIds.has(rowId)) {
            nextForm[i] = { ...nextForm[i] }
            mutator(nextForm[i], cleanValue(newValues[rowId]))
            pendingIds.delete(rowId)
            numInserted++
          }
        }
        setForm(nextForm)
        console.debug('pendingIds', pendingIds)
        console.debug('newValues', newValues)
        if (numInserted > 0) {
          enqueueSnackbar(
            `Successfully pasted ${numInserted}/${numEntries} entries.`,
            {
              variant: 'success',
            },
          )
        } else {
          enqueueSnackbar(
            'No matching project codes found! Make sure the pasted project codes match the ones currently displayed.',
            {
              variant: 'error',
            },
          )
        }
      }
    } catch (e) {
      console.error('Paste error', e)
      enqueueSnackbar('An unexpected error occurred while pasting.', {
        variant: 'error',
      })
    } finally {
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
