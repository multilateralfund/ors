'use client'
import { useId } from 'react'
import React from 'react'

import { Button, Menu, MenuItem } from '@mui/material'

const DropdownContext = React.createContext({ handleClose: () => {} })

export default function Dropdown({
  id,
  children,
  className,
  label,
}: {
  children: React.ReactNode
  className?: string
  id?: string
  label: React.ReactNode
}) {
  const uniqueId = useId()
  const buttonId = `${id || uniqueId}-button`
  const menuId = `${id || uniqueId}-menu`
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <DropdownContext.Provider value={{ handleClose }}>
      <Button
        id={buttonId}
        className={className}
        aria-controls={open ? menuId : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        {label}
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        MenuListProps={{
          'aria-labelledby': buttonId,
        }}
        onClose={handleClose}
      >
        {children}
      </Menu>
    </DropdownContext.Provider>
  )
}

Dropdown.Item = function DropdownItem({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
}) {
  const { handleClose } = React.useContext(DropdownContext)

  return (
    <MenuItem
      onClick={(e) => {
        if (onClick) {
          onClick(e)
        }
        handleClose()
      }}
    >
      {children}
    </MenuItem>
  )
}
