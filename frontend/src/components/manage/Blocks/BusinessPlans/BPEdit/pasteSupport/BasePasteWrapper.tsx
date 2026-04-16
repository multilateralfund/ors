import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { IoClipboardOutline, IoHourglassOutline } from 'react-icons/io5'
import { readPastedTableFromNavigator } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/pasteSupport'
import { APRTableFieldProps } from '@ors/app/annual-project-report/types'
import { find, indexOf, map, replace, trim } from 'lodash'

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
  columns?: APRTableFieldProps[]
}

const normalizeLabel = (label: string) => {
  const formattedYearLabel = replace(label, /\b(\d{4}|XXXX)\b/, 'YEAR')
  const trimmedSlashLabel = replace(formattedYearLabel, /\/\s+/g, '/')

  return trim(trimmedSlashLabel)
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

  const getFieldData = (label: string) =>
    find(columns, (col) => normalizeLabel(col.label) === label)

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

      if (isMultiple && !!columns) {
        const normalizedLabel = normalizeLabel(label)
        const pastedFieldData = getFieldData(normalizedLabel)
        const fieldIndex = indexOf(columns, pastedFieldData)

        const identifierLabel = 'Project Code'
        const projectCodeData = getFieldData(identifierLabel)
        const projectCodeIndex = indexOf(columns, projectCodeData)

        const hasHeaders = pendingIds[0] === identifierLabel
        const firstRowValues = newValues[pendingIds[0]]

        const startIndex = hasHeaders
          ? 0
          : Math.max(
              fieldIndex - firstRowValues.length + 1,
              projectCodeIndex + 1,
            )

        const columnsLabels = hasHeaders
          ? map(firstRowValues, (label) => normalizeLabel(label))
          : map(columns.slice(startIndex, fieldIndex + 1), ({ label }) =>
              normalizeLabel(label),
            )

        if (columnsLabels.includes(normalizedLabel)) {
          for (let i = 0; i < nextForm.length && pendingIds.length; i++) {
            const rowId = nextForm[i][rowIdField]

            if (pendingIds.includes(rowId)) {
              const rowValues = newValues[rowId]

              const values = hasHeaders
                ? rowValues
                : rowValues.slice(0, fieldIndex + 1)

              values.map((value: any, index: number) => {
                const crtFieldObj = getFieldData(columnsLabels[index])

                if (
                  !(
                    crtFieldObj &&
                    crtFieldObj.input &&
                    crtFieldObj.group === pastedFieldData?.group
                  )
                ) {
                  return
                }

                mutator(nextForm[i], cleanValue(value), crtFieldObj.fieldName)
                numColsInserted++
              })

              pendingIds = pendingIds.filter((v) => v != rowId)
              numInserted++
            }
          }
        }
      } else {
        for (let i = 0; i < nextForm.length && pendingIds.length; i++) {
          const rowId = nextForm[i][rowIdField]

          if (pendingIds.includes(rowId)) {
            newValues[rowId].map((value: any) => {
              mutator(nextForm[i], cleanValue(value))
            })

            pendingIds = pendingIds.filter((v) => v != rowId)
            numInserted++
          }
        }
      }
      setPasting(false)
      setForm(nextForm)
      console.debug('pendingIds', pendingIds)
      console.debug('newValues', newValues)

      const errorMessage = `No valid entries found in pasted data! Make sure you are pasting a ${isMultiple ? 'minimum' : ''} 2 column table.`

      if (numInserted > 0) {
        const successMessage = isMultiple
          ? `Successfully pasted ${Math.round(numColsInserted / numInserted)} column(s) for ${numInserted} entries.`
          : `Successfully pasted ${numInserted}/${numEntries} entries.`

        if (!isMultiple || numColsInserted > 0) {
          enqueueSnackbar(successMessage, {
            variant: 'success',
          })
        } else if (isMultiple && numColsInserted === 0) {
          enqueueSnackbar(errorMessage, {
            variant: 'error',
          })
        }
      } else if (pendingIds.length > numInserted) {
        enqueueSnackbar(errorMessage, {
          variant: 'error',
        })
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
