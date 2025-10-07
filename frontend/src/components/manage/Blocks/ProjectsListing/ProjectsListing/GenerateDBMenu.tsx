import React, { useContext, useState } from 'react'

import CustomLink from '@ors/components/ui/Link/Link'
import PermissionsContext from '@ors/contexts/PermissionsContext'

import { Menu, MenuItem } from '@mui/material'
import { MdExpandMore } from 'react-icons/md'
import { GoDatabase } from 'react-icons/go'

const GenerateDBMenu = () => {
  const { canViewProjects } = useContext(PermissionsContext)

  const menuItems = [
    { title: 'Funding amounts', url: null },
    {
      title: 'Project warehouse',
      url: '/projects-listing/export',
      permissions: [canViewProjects],
    },
    { title: 'MYA warehouse', url: null },
    { title: 'ExCom provisions', url: null },
    { title: 'Enterprise warehouse', url: null },
    { title: 'Projects for blanket and individual consideration', url: null },
    { title: 'Report on associated projects', url: null },
  ]

  const filteredMenuItems = menuItems.filter(
    ({ permissions }) => !permissions || permissions.some(Boolean),
  )

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleOpen = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      {filteredMenuItems.length > 0 && (
        <div className="flex cursor-pointer gap-1 px-2" onClick={handleOpen}>
          <GoDatabase className="mb-1" size={18} />
          Generate DB
          <MdExpandMore size={16} color="black" className="mt-0.5" />
        </div>
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
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        disableAutoFocusItem
        slotProps={{
          paper: {
            elevation: 4,
            sx: {
              borderRadius: '10px !important',
              mt: 1,
              minWidth: 180,
              maxWidth: 240,
              boxShadow: '0px 2px 10px rgba(0,0,0,0.08)',
            },
          },
        }}
      >
        {filteredMenuItems.map(({ url, title }) => (
          <MenuItem
            className="whitespace-normal rounded-none p-0 hover:bg-white"
            onClick={handleClose}
            disabled={!url}
          >
            <CustomLink
              className="h-full w-full break-words py-2 pl-3.5 pr-7 text-lg normal-case leading-tight tracking-[0.05em] no-underline"
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

export default GenerateDBMenu
