export const highlightCell = (
  new_value: any,
  old_value: any,
  change_type: string,
) => {
  const isDiff = new_value !== old_value
  if (isDiff) {
    return change_type === 'deleted' ? 'bg-gray-100' : 'bg-green-100'
  }
  return ''
}
