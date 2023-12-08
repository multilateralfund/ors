import defaultColDef from './defaultColDef'

export default function getUsagesColDef() {
  return {
    'Process agent': {
      initialWidth: 132,
    },
    'Refrigeration Manufacturing': {
      initialWidth: 132,
    },
    'Refrigeration Manufacturing AC': {
      initialWidth: 105,
    },
    'Refrigeration Manufacturing Other': {
      headerComponentParams: {
        footnote: 3,
        info: true,
      },
      initialWidth: 100,
    },
    'Refrigeration Manufacturing Refrigeration': {
      initialWidth: 120,
    },
    total_usages: {
      initialWidth: defaultColDef.minWidth,
    },
  }
}
