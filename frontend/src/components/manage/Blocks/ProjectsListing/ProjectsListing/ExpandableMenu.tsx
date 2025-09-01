import React, { useState } from 'react'

import CustomLink from '@ors/components/ui/Link/Link'

import { Button, Menu, MenuItem } from '@mui/material'
import { MdExpandMore } from 'react-icons/md'
import cx from 'classnames'

const ExpandableMenu = ({
  menu,
}: {
  menu: {
    title: string
    menuItems: {
      title: string
      url: string | null
      permissions?: boolean[]
      disabled?: boolean
    }[]
  }
}) => {
  const { title, menuItems } = menu
  const filteredMenuItems = menuItems.filter(
    ({ permissions }) => !permissions || permissions.some(Boolean),
  )

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      {filteredMenuItems.length > 0 && (
        <Button
          className="h-10 cursor-pointer bg-white p-4 text-lg font-semibold uppercase tracking-[0.1em] text-typography-primary shadow-[0_4px_12px_0_rgba(0,0,0,0.25)] hover:bg-white hover:text-typography-primary"
          endIcon={
            <div className="rounded-full border border-solid border-black bg-[#ebff00]">
              <MdExpandMore size={16} color="black" />
            </div>
          }
          size="large"
          variant="contained"
          onClick={handleOpen}
        >
          {title}
        </Button>
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        disablePortal
        keepMounted
        TransitionProps={{
          timeout: 0,
        }}
        MenuListProps={{ disablePadding: true }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            elevation: 4,
            sx: {
              borderRadius: '10px !important',
              mt: 1,
              minWidth: 200,
              boxShadow: '0px 2px 10px rgba(0,0,0,0.08)',
            },
          },
        }}
      >
        {filteredMenuItems.map(({ url, title, disabled }, index) => (
          <div
            className={cx({
              'border-0 border-b-[3px] border-solid border-b-[#62BAF2]':
                index !== filteredMenuItems.length - 1,
            })}
          >
            <MenuItem
              className="rounded-none p-0 hover:bg-mlfs-hlYellow"
              onClick={handleClose}
              disabled={disabled}
            >
              <CustomLink
                className="h-full w-full text-nowrap py-1.5 pl-3 pr-12 text-lg normal-case tracking-[0.05em] no-underline"
                href={url}
                variant="contained"
              >
                {title}
              </CustomLink>
            </MenuItem>
          </div>
        ))}
      </Menu>
    </>
  )
}

export default ExpandableMenu
