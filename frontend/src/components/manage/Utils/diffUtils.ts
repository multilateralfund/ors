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
  const cleanedText = text.replace(/[\r\n]+/g, '');

  if (cleanedText.length <= maxChars) {
    return cleanedText; // No need to truncate
  }

  return cleanedText.substring(0, maxChars) + '...';
}

