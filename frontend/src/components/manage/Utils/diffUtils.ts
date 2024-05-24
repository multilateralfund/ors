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

export function truncateText(text: string, maxWords: number = 4) {
  // Split the text into words
  const words = text.split(' ')

  // Check if the number of words is less than or equal to 4
  if (words.length <= maxWords) {
    return text // No need to truncate
  }

  // Join the first 4 words and add ellipsis
  return words.slice(0, maxWords).join(' ') + '...'
}
