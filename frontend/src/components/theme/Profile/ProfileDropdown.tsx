'use client'
import { useRouter } from 'next/navigation'
import { IoPerson } from 'react-icons/io5'

import Dropdown from '@ors/components/ui/Dropdown'
import useStore from '@ors/store'
import config from '@ors/config'

export default function ProfileDropdown() {
  const router = useRouter()
  const user = useStore((state) => state.user)

  return (
    !!user.data && (
      <Dropdown
        label={<IoPerson size={24} className="text-primary dark:text-white" />}
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
            router.push(config.settings.apiPath + '/admin/')
          }}
        >
          Admin
        </Dropdown.Item>
        <Dropdown.Item onClick={user.logout}>Logout</Dropdown.Item>
      </Dropdown>
    )
  )
}
