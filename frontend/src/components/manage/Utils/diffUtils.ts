export const highlightCell = (
  new_value: any,
  old_value: any,
  change_type: string,
) => {
  const isDiff = new_value !== old_value
  if (isDiff) {
    return change_type === 'deleted' ? 'bg-gray-200' : 'diff-cell-new'
  }
  return ''
}

export function truncateText(text: string, maxChars: number = 20) {
  const cleanedText = text.replace(/[\r\n]+/g, '')

  if (cleanedText.length <= maxChars) {
    return cleanedText // No need to truncate
  }

  return cleanedText.substring(0, maxChars) + '...'
}

export function hasDiff(params: any) {
  const field = params?.colDef?.field
  const isDiffField = params?.colDef?.dataType?.toLowerCase().endsWith('diff')

  if (field && isDiffField) {
    const field_old = `${field}_old`
    let value = params?.data[field]
    value = value === null ? 0 : value
    let value_old = params?.data[field_old]
    value_old = value_old === null ? 0 : value_old
    return value != value_old
  }
}
