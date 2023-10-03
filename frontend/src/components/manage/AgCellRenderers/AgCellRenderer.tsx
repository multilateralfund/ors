import config from '@ors/config'

function getDefaultCellRenderer() {
  return config.table.components[config.table.renderers.default]
}

function getCellRendererByType(type?: string) {
  const componentName = type ? config.table.renderers.type[type] : null
  return componentName ? config.table.components[componentName] : null
}

function getCellRendererByCategory(category?: string) {
  const componentName = category
    ? config.table.renderers.category[category]
    : null
  return componentName ? config.table.components[componentName] : null
}

export default function AgCellRenderer(props: any) {
  const category = props.colDef.category || props.colDef.columnCategory
  const type =
    props.colDef.cellDataType || props.colDef.type || props.colDef.dataType

  const CellRenderer =
    getCellRendererByCategory(category) ||
    getCellRendererByType(type) ||
    getDefaultCellRenderer()
  return <CellRenderer {...props} />
}
