'use client'
import React from 'react'

import { useLocation } from 'wouter'

import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import { formatApiUrl } from '@ors/helpers/Api/utils'
import { useStore } from '@ors/store'
import version from '~/version.json'

import { IoMenu, IoPersonOutline } from 'react-icons/io5'

export type ProfileDropdownProps = {
  className?: string
}

export default function ProfileDropdown({ className }: ProfileDropdownProps) {
  const [_, setLocation] = useLocation()
  const user = useStore((state) => state.user)

  return (
    <Dropdown
      className={className}
      label={
        <div className="flex flex-row items-center justify-between gap-x-2 text-xl font-normal uppercase">
          <IoMenu
            className="block text-secondary theme-dark:text-white md:hidden"
            size={24}
          />
          <IoPersonOutline className="hidden text-secondary theme-dark:text-white md:block" />
          <span className="hidden md:inline">My account</span>
        </div>
      }
    >
      <Dropdown.Item
        onClick={() => {
          setLocation('/change-password')
        }}
      >
        Change Password
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => {
          setLocation(formatApiUrl('/admin/'))
        }}
      >
        Admin
      </Dropdown.Item>
      <Dropdown.Item onClick={user.logout}>Logout</Dropdown.Item>
      <Dropdown.Item>
        V{version.major}.{version.minor}.{version.patch}
      </Dropdown.Item>
    </Dropdown>
  )
}
