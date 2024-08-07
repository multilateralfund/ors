const renderers: {
  category: Record<string, string>
  default: string
  type: Record<string, string>
} = {
  category: {
    adm: 'agAdmCellRenderer',
    usage: 'agUsageCellRenderer',
    usage_diff: 'agUsageDiffCellRenderer',
  },
  default: 'agTextCellRenderer',
  type: {
    boolean: 'agBooleanCellRenderer',
    date: 'agDateCellRenderer',
    float: 'agFloatCellRenderer',
    number: 'agFloatCellRenderer',
    number_diff: 'agFloatDiffCellRenderer',
    text: 'agTextCellRenderer',
    text_diff: 'agTextDiffCellRenderer',
  },
}

export default renderers
