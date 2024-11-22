import { useCallback, useEffect } from 'react'

import { IoClipboardOutline } from 'react-icons/io5'

export function parsePastedText(text: string) {
  let result: any

  if (text.endsWith('\n')) {
    result = text.split('\n')
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

export function removeEmptyColumns(matrix: string[][]) {
  return transposeMatrix(
    transposeMatrix(matrix).filter((r) => r.filter((c) => !!c).length),
  )
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

export async function readPastedTableFromNavigator() {
  let result: any[][] = []
  try {
    const pasteData = await navigator.clipboard.read()
    const paste = pasteData[0]
    const pastedTable =
      paste.types.indexOf('text/html') != -1
        ? parsePastedHTML(await (await paste.getType('text/html')).text())
        : parsePastedText(await (await paste.getType('text')).text())

    const cleanTable = removeEmptyColumns(pastedTable)
    result = cleanTable
  } catch {
    console.warn('Could not read clipboard data!')
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

  return <BasePasteWrapper addTopMargin={true} mutator={mutateRow} {...rest} />
}

export function BasePasteWrapper(props: any) {
  const { addTopMargin = false, label, mutator, setForm } = props

  const styles: Record<string, string> = {
    fontSize: '0.75rem',
  }

  if (addTopMargin) {
    styles.marginTop = '2.9em'
  }

  async function handlePaste() {
    const pastedTable = await readPastedTableFromNavigator()
    setForm(function (prev) {
      const next = [...prev!]
      const newValues: Record<number, any> = {}
      for (let i = 0; i < pastedTable.length; i++) {
        const row = pastedTable[i]
        const entryId = parseInt(row[0], 10)
        if (entryId && !isNaN(entryId)) {
          const entryValue = row[1]
          newValues[entryId] = entryValue
        }
      }
      let pendingIds = Array.from(Object.keys(newValues)).map((v) =>
        parseInt(v, 10),
      )
      for (let i = 0; i < next.length && pendingIds.length; i++) {
        const rowId = next[i].id
        if (pendingIds.includes(rowId)) {
          mutator(next[i], newValues[rowId])
          pendingIds = pendingIds.filter((v) => v != rowId)
        }
      }
      return next
    })
  }
  return (
    <div
      className="flex h-full w-full items-center justify-center gap-x-2 hover:text-red-500"
      style={styles}
      title="Click for paste."
      onClick={handlePaste}
    >
      <div>{label}</div>
      <div>
        <IoClipboardOutline />
      </div>
    </div>
  )
}
