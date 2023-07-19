'use client'
import { useRouter } from 'next/navigation'
import { IoPerson } from 'react-icons/io5'

import Dropdown from '@ors/components/ui/Dropdown'
import useStore from '@ors/store'

export default function ProfileDropdown() {
  const router = useRouter()
  const user = useStore((state) => state.user)

  return (
    !!user.data && (
      <Dropdown label={<IoPerson size={24} />}>
        <Dropdown.Item
          onClick={() => {
            router.push('/profile')
          }}
        >
          Profile
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => {
            router.push('/admin')
          }}
        >
          Admin
        </Dropdown.Item>
        <Dropdown.Item onClick={user.logout}>Logout</Dropdown.Item>
      </Dropdown>
    )
  )
}
