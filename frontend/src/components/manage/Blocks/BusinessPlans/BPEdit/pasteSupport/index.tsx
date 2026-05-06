import { EnqueueSnackbar } from 'notistack'

function parsePastedText(text: string) {
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
    // This should always be true for XLS paste
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
  const numCols = matrix.reduce((max, row) => Math.max(max, row.length), 0)
  const result: typeof matrix = Array.from({ length: numCols }, () =>
    new Array(matrix.length).fill(''),
  )

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      result[j][i] = matrix[i][j] ?? ''
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

function normalizeCell(c: string) {
  return (c ?? '').replace(/\u00A0/g, ' ').trim()
}

function removeEmptyRows(matrix: string[][]) {
  return matrix.filter((r) => r.filter((c) => !!normalizeCell(c)).length)
}

function extractLangFromHTML(html: string): string | null {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return (
      doc.documentElement.getAttribute('lang') ||
      doc.body.getAttribute('lang') ||
      null
    )
  } catch {
    return null
  }
}

function parsePastedHTML(html: string) {
  const result: any = []

  const el = document.createElement('body')
  el.innerHTML = html

  const elTable = el.querySelector('table') as HTMLTableElement

  for (let i = 0; i < elTable.rows.length; i++) {
    result.push([])
    for (let j = 0; j < elTable.rows[i].cells.length; j++) {
      result[i].push(normalizeCell(elTable.rows[i].cells[j].textContent ?? ''))
    }
  }

  return result
}

export async function readPastedTableFromNavigator(
  throwError: EnqueueSnackbar,
  isMultiple: boolean,
): Promise<{ table: any[][]; sourceLang: string | null }> {
  let result: any[][] = []
  let sourceLang: string | null = null
  let canceled = false
  try {
    const pasteData = await navigator.clipboard.read()
    const paste = pasteData[0]
    const htmlContent =
      paste.types.indexOf('text/html') != -1
        ? await (await paste.getType('text/html')).text()
        : ''

    const textContent = await (await paste.getType('text/plain')).text()

    if (htmlContent) {
      sourceLang = extractLangFromHTML(htmlContent)
      console.log(
        '[paste] detected sourceLang from clipboard HTML:',
        sourceLang,
      )
    }

    const pastedTable = !!htmlContent
      ? parsePastedHTML(htmlContent)
      : parsePastedText(textContent)

    if (pastedTable.length === 0 || (pastedTable[0]?.length ?? 0) < 2) {
      throwError(
        `Could not read a valid table from clipboard! Make sure you are pasting a ${isMultiple ? 'minimum' : ''} 2 column table.`,
        { variant: 'error' },
      )
      return { table: [], sourceLang }
    }

    // For multi-column paste, only remove empty rows and leave all columns intact.
    // This way, intentionally empty values are preserved (!),
    // and column position alignment is not corrupted by dropping empty columns.
    const cleanTable = isMultiple
      ? removeEmptyRows(pastedTable)
      : removeEmptyRowsAndColumns(pastedTable)
    result = isMultiple ? cleanTable : getOnlyFirstAndLastColumns(cleanTable)
  } catch (error) {
    if (error.name === 'NotFoundError') {
      throwError(
        `Could not read clipboard data! Make sure you are pasting a ${isMultiple ? 'minimum' : ''} 2 column table.`,
        {
          variant: 'error',
        },
      )
    } else if (error.name === 'NotAllowedError') {
      canceled = true
    }
  }
  if (
    !canceled &&
    (result.length == 0 ||
      (isMultiple && result[0].length < 2) ||
      (!isMultiple && result[0].length != 2))
  ) {
    result = []
    throwError(
      `Could not read a valid table from clipboard! Make sure you are pasting a ${isMultiple ? 'minimum' : ''} 2 column table.`,
      {
        variant: 'error',
      },
    )
  }
  return { table: result, sourceLang }
}
