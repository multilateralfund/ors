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
  // Check if the length of the text is less than or equal to maxChars
  if (text.length <= maxChars) {
    return text // No need to truncate
  }

  // Truncate the text to the maximum number of characters and add ellipsis
  return text.substring(0, maxChars) + '...'
}

