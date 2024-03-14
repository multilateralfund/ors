'use client'
import React from 'react'

import { useRouter } from 'next/navigation'

import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import { formatApiUrl } from '@ors/helpers/Api/Api'
import { useStore } from '@ors/store'
import version from '~/version.json'

import { IoPersonOutline } from 'react-icons/io5'

export type ProfileDropdownProps = {
  className?: string
}

export default function ProfileDropdown({ className }: ProfileDropdownProps) {
  const router = useRouter()
  const user = useStore((state) => state.user)

  return (
    <Dropdown
      className={className}
      label={
        <div className="flex flex-row items-center justify-between gap-x-2 text-xl font-normal uppercase">
          <IoPersonOutline className="text-secondary theme-dark:text-white" />
          My account
        </div>
      }
    >
      <Dropdown.Item
        onClick={() => {
          router.push('/change-password')
        }}
      >
        Change Password
      </Dropdown.Item>
      <Dropdown.Item
        onClick={() => {
          router.push(formatApiUrl('/admin/'))
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
