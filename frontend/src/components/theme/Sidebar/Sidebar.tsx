'use client'
import { Box } from '@mui/material'
import cx from 'classnames'
import { usePathname } from 'next/navigation'

import FadeInOut from '@ors/components/manage/Utils/FadeInOut'
import Link from '@ors/components/ui/Link'

import { IoBarChart } from '@react-icons/all-files/io5/IoBarChart'
import { IoPieChart } from '@react-icons/all-files/io5/IoPieChart'

const items = [
  { Icon: IoPieChart, href: '/', isExact: true, title: 'Dashboard' },
  { Icon: IoBarChart, href: '/reports', isExact: false, title: 'Reports' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <Box
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sidebar h-full rounded-none border-0 border-r px-4 py-8"
      FadeInOut={{ component: 'div' }}
      component={FadeInOut}
    >
      {items.map((item, index) => (
        <Link
          key={item.href}
          className={cx(
            'flex flex-col items-center rounded p-2 theme-dark:text-white',
            {
              'bg-primary text-white transition-colors': item.isExact
                ? pathname === item.href
                : pathname.includes(item.href),
              'mb-6': index < items.length - 1,
            },
          )}
          href={item.href}
          underline="none"
        >
          <item.Icon className="mb-1" size={24} />
          <span>{item.title}</span>
        </Link>
      ))}
    </Box>
  )
}
