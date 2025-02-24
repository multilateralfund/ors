import { ApiEditBPActivity } from '@ors/types/api_bp_get'

import { useCallback, useState } from 'react'

import { EnqueueSnackbar, useSnackbar } from 'notistack'

import { IoClipboardOutline, IoHourglassOutline } from 'react-icons/io5'

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

export function parsePastedText(text: string) {
  let result: any

  if (text.endsWith('\r')) {
    text = `${text}\n`
  }

  const lineEnd = text.endsWith('\r\n') ? '\r\n' : '\n'

  if (text.endsWith(lineEnd)) {
    result = text.split(lineEnd)
    for (let i = 0; i < result.length; i++) {
      result[i] = result[i].split('\t')
    }
    // This shoud always be true for XLS paste
    // (an extra "\n" is introduced when selecting multiple cells).
    if (result[result.length - 1][0] === '') {
      result.pop()
    }
  } else {
    result = [[text]]
  }
  return result
}

function transposeMatrix(matrix: string[][]) {
  const result: typeof matrix = new Array(matrix[0].length)

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (!result[j]) {
        result[j] = new Array(matrix.length)
      }
      result[j][i] = matrix[i][j]
    }
  }

  return result
}

function removeEmptyRowsAndColumns(matrix: string[][]) {
  return transposeMatrix(
    removeEmptyRows(transposeMatrix(removeEmptyRows(matrix))),
  )
}

function getOnlyFirstAndLastColumns(matrix: string[][]) {
  return matrix.map((cols) => [cols[0], cols[cols.length - 1]])
}

function removeEmptyRows(matrix: string[][]) {
  return matrix.filter((r) => r.filter((c) => !!c).length)
}

export function parsePastedHTML(html: string) {
  const result: any = []

  const el = document.createElement('body')
  el.innerHTML = html

  const elTable = el.querySelector('table') as HTMLTableElement

  for (let i = 0; i < elTable.rows.length; i++) {
    result.push([])
    for (let j = 0; j < elTable.rows[i].cells.length; j++) {
      result[i].push(elTable.rows[i].cells[j].textContent)
    }
  }

  return result
}

export async function readPastedTableFromNavigator(
  throwError: EnqueueSnackbar,
) {
  let result: any[][] = []
  let canceled = false
  try {
    const pasteData = await navigator.clipboard.read()
    const paste = pasteData[0]
    const htmlContent =
      paste.types.indexOf('text/html') != -1
        ? await (await paste.getType('text/html')).text()
        : ''

    const textContent = await (await paste.getType('text/plain')).text()

    const pastedTable = !!htmlContent
      ? parsePastedHTML(htmlContent)
      : parsePastedText(textContent)

    const cleanTable = removeEmptyRowsAndColumns(pastedTable)
    result = getOnlyFirstAndLastColumns(cleanTable)
  } catch (error) {
    if (error.name === 'NotFoundError') {
      throwError(
        'Could not read clipbord data! Make sure you are pasting a 2 column table.',
        {
          variant: 'error',
        },
      )
    } else if (error.name === 'NotAllowedError') {
      canceled = true
    }
  }
  if (!canceled && (result.length == 0 || result[0].length != 2)) {
    result = []
    throwError(
      'Could not read a valid table from clipboard! Make sure you are pasting a 2 column table.',
      {
        variant: 'error',
      },
    )
  }
  return result
}

export function HeaderPasteWrapper(props: any) {
  const { field, ...rest } = props
  const mutateRow = useCallback(
    function (row: any, value: any) {
      row[field] = value
    },
    [field],
  )

  return <BasePasteWrapper mutator={mutateRow} {...rest} />
}

export function BasePasteWrapper(props: any) {
  const { label, mutator, setForm } = props
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
        const entryValue = row[1]
        newValues[entryId] = entryValue
      }
    }
    let pendingIds = Array.from(Object.keys(newValues))
    const numEntries = pendingIds.length
    let numInserted = 0
    if (numEntries > 0) {
      setForm(function (prev: ApiEditBPActivity[]) {
        const next = [...prev!]
        for (let i = 0; i < next.length && pendingIds.length; i++) {
          const rowId = next[i].display_internal_id
          if (pendingIds.includes(rowId)) {
            mutator(next[i], cleanValue(newValues[rowId]))
            pendingIds = pendingIds.filter((v) => v != rowId)
            numInserted++
          }
        }
        setPasting(false)
        return next
      })
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
