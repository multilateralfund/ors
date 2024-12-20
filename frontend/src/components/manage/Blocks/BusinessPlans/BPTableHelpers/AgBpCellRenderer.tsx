import components from '@ors/config/Table/components'
import renderers from '@ors/config/Table/renderers'

function getDefaultCellRenderer() {
  return components[renderers.default]
}

function getCellRendererByType(type?: string) {
  const componentName = type ? renderers.type[type] : null
  return componentName ? components[componentName] : null
}

function getCellRendererByCategory(category?: string) {
  const componentName = category ? renderers.category[category] : null
  return componentName ? components[componentName] : null
}

export default function AgBpCellRenderer(props: any) {
  const category = props.colDef.category
  const type = props.colDef.dataType

  const CellRenderer =
    getCellRendererByCategory(category) ||
    getCellRendererByType(type) ||
    getDefaultCellRenderer()

  return (
    <div className="cell-renderer">
      <div className="inline">
        <CellRenderer {...props} />
      </div>
    </div>
  )
}
