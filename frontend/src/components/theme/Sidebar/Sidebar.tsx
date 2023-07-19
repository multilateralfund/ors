'use client'
import cx from 'classnames'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IoBarChart, IoPieChart } from 'react-icons/io5'

import useStore from '@ors/store'

const items = [
  { title: 'Dashboard', href: '/', Icon: IoBarChart },
  { title: 'Reports', href: '/reports', Icon: IoPieChart },
]

export default function Sidebar() {
  const pathname = usePathname()
  const user = useStore((state) => state.user)

  return (
    !!user.data && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="h-full bg-white px-4 py-8 shadow"
      >
        {items.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              'flex flex-col items-center rounded p-2 text-primary no-underline',
              {
                'mb-6': index < items.length - 1,
                'bg-primary text-white transition-colors duration-300':
                  pathname === item.href,
              },
            )}
          >
            <item.Icon size={24} className="mb-1" />
            <span>{item.title}</span>
          </Link>
        ))}
      </motion.div>
    )
  )
}
