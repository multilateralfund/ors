import defaultColDef from './defaultColDef'

export default function getUsagesColDef() {
  return {
    'Process agent': {
      initialWidth: 132,
    },
    'Refrigeration Manufacturing': {
      initialWidth: 132,
    },
    total_usages: {
      initialWidth: defaultColDef.minWidth,
    },
  }
}
