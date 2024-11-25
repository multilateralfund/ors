const renderers: {
  category: Record<string, string>
  default: string
  type: Record<string, string>
} = {
  category: {
    adm: 'agAdmCellRenderer',
    checkbox: 'agCheckboxCellRenderer',
    usage: 'agUsageCellRenderer',
    usage_diff: 'agUsageDiffCellRenderer',
  },
  default: 'agTextCellRenderer',
  type: {
    boolean: 'agBooleanCellRenderer',
    date: 'agDateCellRenderer',
    date_diff: 'agDateDiffCellRenderer',
    float: 'agFloatCellRenderer',
    number: 'agFloatCellRenderer',
    number_diff: 'agFloatDiffCellRenderer',
    text: 'agTextCellRenderer',
    text_diff: 'agTextDiffCellRenderer',
  },
}

export default renderers
