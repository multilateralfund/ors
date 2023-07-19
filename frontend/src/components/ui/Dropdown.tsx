import React from 'react'

import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

export default function Dropdown({
  children,
  label,
}: {
  children: React.ReactNode
  label: React.ReactNode
}) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const childrenWithProps = React.Children.map(children, (child) => {
    // Checking isValidElement is the safe way and avoids a
    // typescript error too.
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        handleClose,
      })
    }
    return child
  })

  return (
    <div>
      <Button
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        className="normal-case"
      >
        {label}
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {childrenWithProps}
      </Menu>
    </div>
  )
}

// eslint-disable-next-line react/display-name
Dropdown.Item = ({
  children,
  onClick,
  handleClose,
}: {
  children: React.ReactNode
  onClick: Function
  handleClose?: Function
}) => {
  return (
    <MenuItem
      onClick={(e) => {
        if (onClick) {
          onClick(e)
        }
        if (handleClose) {
          handleClose()
        }
      }}
    >
      {children}
    </MenuItem>
  )
}
