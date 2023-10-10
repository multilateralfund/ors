'use client'
import React from 'react'

import version from '@ors/../version.json'
import { useRouter } from 'next/navigation'

import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
import { formatApiUrl } from '@ors/helpers/Api'
import useStore from '@ors/store'

import { IoPerson } from '@react-icons/all-files/io5/IoPerson'

export type ProfileDropdownProps = {
  className?: string
}

export default function ProfileDropdown({ className }: ProfileDropdownProps) {
  const router = useRouter()
  const user = useStore((state) => state.user)

  return (
    !!user.data && (
      <Dropdown
        className={className}
        label={
          <IoPerson className="text-primary theme-dark:text-white" size={24} />
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
  )
}
