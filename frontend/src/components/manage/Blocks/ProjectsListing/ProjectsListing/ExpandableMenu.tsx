import React, { useState } from 'react'

import CustomLink from '@ors/components/ui/Link/Link'

import { Button, Menu, MenuItem } from '@mui/material'
import { MdExpandMore } from 'react-icons/md'
import cx from 'classnames'

const ExpandableMenu = ({
  menu,
}: {
  menu: { title: string; menuItems: { title: string; url: string | null }[] }
}) => {
  const { title, menuItems } = menu

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
        {menuItems.map(({ url, title }, index) => (
          <MenuItem
            className={cx(
              'rounded-none py-1.5 pl-3 pr-12 hover:bg-mlfs-hlYellow',
              {
                'border-b-[3px] border-solid border-b-[#62BAF2]':
                  index !== menuItems.length - 1,
              },
            )}
            onClick={handleClose}
          >
            <CustomLink
              className="text-nowrap text-lg normal-case tracking-[0.05em] no-underline"
              href={url}
              variant="contained"
            >
              {title}
            </CustomLink>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default ExpandableMenu
