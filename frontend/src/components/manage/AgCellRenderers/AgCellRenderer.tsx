import { useState } from 'react'

import { IconButton, Tooltip } from '@mui/material'

import components from '@ors/config/Table/components'
import renderers from '@ors/config/Table/renderers'

import { getError } from '@ors/helpers/Utils/Utils'

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
  const category = props.colDef.category
  const type = props.colDef.cellDataType

  const error = getError(props)

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
