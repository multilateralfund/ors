// @ts-nocheck
import React from 'react'

import { Button, Menu, MenuItem } from '@mui/material'

import { AnyObject } from '@ors/@types/primitives'

export default function Dropdown({
  children,
  className,
  label,
}: {
  children: React.ReactNode
  className?: string
  label: React.ReactNode
}) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
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
      return React.cloneElement(child as React.ReactElement<AnyObject>, {
        handleClose,
      })
    }
    return child
  })

  return (
    <>
      <Button
        id="basic-button"
        className={className}
        aria-controls={open ? 'basic-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        {label}
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        onClose={handleClose}
      >
        {childrenWithProps}
      </Menu>
    </>
  )
}

// eslint-disable-next-line react/display-name
Dropdown.Item = ({
  children,
  handleClose,
  onClick,
}: {
  children: React.ReactNode
  handleClose?: () => void
  onClick: (e: React.MouseEvent) => void
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
