import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { IoClipboardOutline, IoHourglassOutline } from 'react-icons/io5'
import { readPastedTableFromNavigator } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/pasteSupport'
import { BPEditTableInterface } from '@ors/components/manage/Blocks/BusinessPlans/types.ts'

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
type BasePasteWrapperProps = {
  label: string
  mutator: (row: any, value: any) => void
  // activitiesRef: any
} & Pick<BPEditTableInterface, 'form' | 'setForm'>
export function BasePasteWrapper(props: BasePasteWrapperProps) {
  const { label, mutator, form, setForm } = props
  const { enqueueSnackbar } = useSnackbar()
  const [pasting, setPasting] = useState(false)

  async function handlePaste() {
    setPasting(true)
    const pastedTable = await readPastedTableFromNavigator(enqueueSnackbar)
    const newValues: Record<string, any> = {}
    for (let i = 0; i < pastedTable.length; i++) {
      const row = pastedTable[i]
      const entryId = row[0]
      if (entryId) {
        newValues[entryId] = row[1]
      }
    }
    let pendingIds = Array.from(Object.keys(newValues))
    const numEntries = pendingIds.length
    let numInserted = 0
    if (numEntries > 0) {
      const nextForm = [...form!]
      for (let i = 0; i < nextForm.length && pendingIds.length; i++) {
        const rowId = nextForm[i].display_internal_id
        if (pendingIds.includes(rowId)) {
          mutator(nextForm[i], cleanValue(newValues[rowId]))
          pendingIds = pendingIds.filter((v) => v != rowId)
          numInserted++
        }
      }
      setPasting(false)
      setForm(nextForm)
      if (numInserted > 0) {
        enqueueSnackbar(
          `Successfully pasted ${numInserted}/${numEntries} entries.`,
          {
            variant: 'success',
          },
        )
      } else if (pendingIds.length > numInserted) {
        enqueueSnackbar(
          'No valid entries found in pasted data! Make sure you are pasting a 2 column table.',
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
