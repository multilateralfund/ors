import * as Sentry from '@sentry/react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { IoClipboardOutline, IoHourglassOutline } from 'react-icons/io5'
import { readPastedTableFromNavigator } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/pasteSupport'
import { APRTableFieldProps } from '@ors/app/annual-project-report/types'
import { find, indexOf, map, replace, trim } from 'lodash'

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
    return toParse
      .replaceAll(thousandSeparator, '')
      .replace(decimalSeparator, '.')
  }
  return value
}
interface BasePasteWrapperProps {
  label: string
  mutator: (row: any, value: any, field?: APRTableFieldProps) => void
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
    let pastedTable: any[][] = []
    try {
      pastedTable = await readPastedTableFromNavigator(
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
      const pendingIds = new Set(Object.keys(newValues))
      const numEntries = pendingIds.size
      let numInserted = 0
      let numColsInserted = 0

      if (numEntries === 0) {
        enqueueSnackbar(
          'No project codes found in pasted data! Make sure the first column contains project codes.',
          { variant: 'error' },
        )
        return
      }

      if (numEntries > 0) {
        const nextForm = [...form!]

        if (isMultiple && !!columns) {
          const normalizedLabel = normalizeLabel(label)
          const pastedFieldData = getFieldData(normalizedLabel)
          const fieldIndex = indexOf(columns, pastedFieldData)

          const identifierLabel = 'Project Code'
          const projectCodeData = getFieldData(identifierLabel)
          const projectCodeIndex = indexOf(columns, projectCodeData)

          const firstPendingId = pendingIds.values().next().value
          const hasHeaders = firstPendingId === identifierLabel
          const firstRowValues = newValues[firstPendingId!]

          // In the no-headers path, we infer which columns were pasted by
          // anchoring to the group boundary of the clicked column.
          // Using `projectCodeIndex+1` as the lower bound could span multiple column
          // groups and cause values to be applied to the wrong fields.
          const groupStartIndex =
            pastedFieldData?.group != null
              ? columns.findIndex((col) => col.group === pastedFieldData.group)
              : projectCodeIndex + 1
          const startIndex = hasHeaders
            ? 0
            : Math.max(fieldIndex - firstRowValues.length + 1, groupStartIndex)

          const columnsLabels = hasHeaders
            ? map(firstRowValues, (label) => normalizeLabel(label))
            : map(columns.slice(startIndex, fieldIndex + 1), ({ label }) =>
                normalizeLabel(label),
              )

          if (columnsLabels.includes(normalizedLabel)) {
            for (let i = 0; i < nextForm.length && pendingIds.size; i++) {
              const rowId = nextForm[i][rowIdField]

              if (pendingIds.has(rowId)) {
                const rowValues = newValues[rowId]
                // Slice by columnsLabels.length, not fieldIndex, so the bound
                // reflects the actual number of mapped columns
                // rather than an unrelated schema position.
                const values = hasHeaders
                  ? rowValues
                  : rowValues.slice(0, columnsLabels.length)

                nextForm[i] = { ...nextForm[i] }

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

                  mutator(nextForm[i], cleanValue(value), crtFieldObj)
                  numColsInserted++
                })

                pendingIds.delete(rowId)
                numInserted++
              }
            }
          }
        } else {
          // Single-column mode (Business Plans)

          // getOnlyFirstAndLastColumns ensures newValues[rowId] always has
          // exactly one element.
          // Only the first (and only) value is applied; no field metadata is passed
          // because columns/isMultiple are not provided in this branch.
          for (let i = 0; i < nextForm.length && pendingIds.size; i++) {
            const rowId = nextForm[i][rowIdField]

            if (pendingIds.has(rowId)) {
              nextForm[i] = { ...nextForm[i] }
              mutator(nextForm[i], cleanValue(newValues[rowId][0]))
              pendingIds.delete(rowId)
              numInserted++
            }
          }
        }
        setForm(nextForm)
        console.debug('pendingIds', pendingIds)
        console.debug('newValues', newValues)

        if (numInserted > 0) {
          const successMessage = isMultiple
            ? `Successfully pasted ${Math.round(numColsInserted / numInserted)} column(s) for ${numInserted} entries.`
            : `Successfully pasted ${numInserted}/${numEntries} entries.`

          if (!isMultiple || numColsInserted > 0) {
            enqueueSnackbar(successMessage, {
              variant: 'success',
            })
          } else if (isMultiple && numColsInserted === 0) {
            enqueueSnackbar(
              `No valid entries found in pasted data! Make sure you are pasting a ${isMultiple ? 'minimum' : ''} 2 column table.`,
              {
                variant: 'error',
              },
            )
          }
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
      Sentry.withScope((scope) => {
        scope.setTag('feature', 'paste')
        scope.setContext('paste', {
          label,
          rowIdField,
          formLength: form?.length ?? 0,
          pastedRowCount: pastedTable.length,
          pastedSample: [
            ...pastedTable.slice(0, 5),
            ...pastedTable.slice(-5),
          ].filter((row, idx, arr) => arr.indexOf(row) === idx),
          userAgent: navigator.userAgent,
          language: navigator.language,
        })
        Sentry.captureException(e)
      })
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
