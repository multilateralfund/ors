import { useState } from 'react'

import { IconButton, Tooltip } from '@mui/material'
import { isFunction } from 'lodash'

import components from '@ors/config/Table/components'
import renderers from '@ors/config/Table/renderers'

import { IoInformation } from '@react-icons/all-files/io5/IoInformation'

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

export default function AgCellRenderer(props: any) {
  const [showError, setShowError] = useState(false)
  const category = props.colDef.category || props.colDef.columnCategory
  const type =
    props.colDef.cellDataType || props.colDef.type || props.colDef.dataType
  const error = isFunction(props.colDef.error)
    ? props.colDef.error(props)
    : props.colDef.error

  const CellRenderer =
    getCellRendererByCategory(category) ||
    getCellRendererByType(type) ||
    getDefaultCellRenderer()

  return (
    <>
      <CellRenderer {...props} />
      {!!error && (
        <Tooltip
          open={showError}
          placement="top"
          title={error}
          onClose={() => {
            setShowError(false)
          }}
          disableHoverListener
          disableTouchListener
        >
          <div className="ag-error-info">
            <IconButton
              color="error"
              size="small"
              onClick={() => setShowError(true)}
            >
              <IoInformation />
            </IconButton>
          </div>
        </Tooltip>
      )}
    </>
  )
}
