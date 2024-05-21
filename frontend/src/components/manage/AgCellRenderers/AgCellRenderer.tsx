import { useState } from 'react'

import { IconButton, Tooltip } from '@mui/material'

import components from '@ors/config/Table/components'
import renderers from '@ors/config/Table/renderers'

import DiffPill from '@ors/components/ui/DiffUtils/DiffPill'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import { getError } from '@ors/helpers/Utils/Utils'

import CellValidationWidget from '../AgWidgets/CellValidationWidget/CellValidationWidget'

import { IoInformation, IoOptions } from 'react-icons/io5'

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
  const change_type = props.data.change_type
  const showDiff = props.column.colId === 'display_name' && change_type

  const error = getError(props)

  const options = props.options || null
  const optionsInDropdown = props.optionsInDropdown || false

  const CellRenderer =
    getCellRendererByCategory(category) ||
    getCellRendererByType(type) ||
    getDefaultCellRenderer()

  return (
    <div className="cell-renderer">
      <CellValidationWidget className="cell-validation-error" {...props} />
      {!!options && optionsInDropdown && (
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
      {!!options && !optionsInDropdown && (
        <div className="ag-cell-options inline-block pr-2">{options}</div>
      )}
      <div
        className={`${showDiff ? 'flex flex-wrap-reverse items-center justify-between gap-x-2' : 'inline'}`}
      >
        <CellRenderer {...props} />
        {showDiff && <DiffPill change_type={change_type} />}
      </div>

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
    </div>
  )
}
