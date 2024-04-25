import { useContext, useState } from 'react'

import { IconButton, Tooltip } from '@mui/material'

import components from '@ors/config/Table/components'
import renderers from '@ors/config/Table/renderers'

import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import { ValidationContext } from '@ors/contexts/Validation/Validation'
import { ValidationSchemaKeys } from '@ors/contexts/Validation/types'
import { getError } from '@ors/helpers/Utils/Utils'

import { IoInformation, IoInformationCircle, IoOptions } from 'react-icons/io5'

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
  const type = props.colDef.dataType

  const error = getError(props)

  const validation =
    useContext(ValidationContext)?.errors[
      props.context.section.id as ValidationSchemaKeys
    ]

  const rowErrors = validation?.rows[props.data.row_id] || []

  const showErrorInfo =
    props.column.colId === 'display_name' && rowErrors.length > 0
  const cellHighlight =
    rowErrors.length > 0 &&
    rowErrors.filter((err) => err.highlight_cells.includes(props.column.colId))
      .length > 0

  const options = props.options || null

  const CellRenderer =
    getCellRendererByCategory(category) ||
    getCellRendererByType(type) ||
    getDefaultCellRenderer()

  return (
    <>
      {!!options && (
        <div className="ag-cell-options inline-block">
          <Dropdown
            className="py-0 pl-0"
            color="primary"
            label={<IoOptions />}
            icon
          >
            {options}
          </Dropdown>
        </div>
      )}
      {(showErrorInfo || cellHighlight) && (
        <div className="absolute right-1 top-1.5 inline-block leading-tight text-red-950">
          <IoInformationCircle
            size={24}
            title={rowErrors.map((e) => e.message).join(', ')}
          />
        </div>
      )}
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
