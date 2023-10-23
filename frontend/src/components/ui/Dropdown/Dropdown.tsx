'use client'
import React, { useMemo } from 'react'
import { useEffect, useId, useRef } from 'react'

import {
  ButtonProps,
  Menu,
  MenuItem,
  Button as MuiButton,
  IconButton as MuiIconButton,
} from '@mui/material'
import { isFunction } from 'lodash'

const DropdownContext = React.createContext({ handleClose: () => {} })

export default function Dropdown({
  id,
  children,
  className,
  color,
  icon,
  label,
}: {
  children: React.ReactNode
  className?: string
  icon?: boolean
  id?: string
  label: ((props?: any) => React.ReactElement) | React.ReactNode
} & ButtonProps) {
  const uniqueId = useId()
  const buttonRef = useRef<any>()
  const menuRef = useRef<any>()
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

  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.setAttribute('id', buttonId)
    }
  }, [buttonId])

  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.setAttribute('id', menuId)
    }
  }, [menuId])

  const Button = useMemo(() => (icon ? MuiIconButton : MuiButton), [icon])

  return (
    <DropdownContext.Provider value={{ handleClose }}>
      {/* @ts-ignore */}
      <Button
        className={className}
        aria-controls={open ? menuId : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        color={color}
        ref={buttonRef}
        onClick={handleClick}
      >
        {isFunction(label) ? label({ open }) : label}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        ref={menuRef}
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
