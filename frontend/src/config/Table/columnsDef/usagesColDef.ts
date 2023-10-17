import defaultColDef from './defaultColDef'

export default function getUsagesColDef() {
  return {
    total_usages: {
      initialWidth: defaultColDef.minWidth,
    },
  }
}
