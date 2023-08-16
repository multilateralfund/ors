'use client'
import { Box, useTheme } from '@mui/material'
import useMediaQuery from '@mui/material/useMediaQuery'
import cx from 'classnames'
import { usePathname } from 'next/navigation'

import FadeInOut from '@ors/components/manage/Utils/FadeInOut'
import ThemeSelector from '@ors/components/theme/ThemeSelector/ThemeSelector'
import Link from '@ors/components/ui/Link'
import useStore from '@ors/store'

import { IoBarChart } from '@react-icons/all-files/io5/IoBarChart'
import { IoPieChart } from '@react-icons/all-files/io5/IoPieChart'
import { IoReaderOutline } from '@react-icons/all-files/io5/IoReaderOutline'

const items = [
  { Icon: IoPieChart, href: '/', isExact: true, title: 'Dashboard' },
  { Icon: IoBarChart, href: '/reports', isExact: false, title: 'Reports' },
  {
    Icon: IoReaderOutline,
    href: '/projects',
    isExact: false,
    title: 'Projects',
  },
]

export default function Sidebar() {
  const controls = useStore((state) => state.controls)
  const theme = useTheme()
  const pathname = usePathname()
  const isMdScreen = useMediaQuery(theme.breakpoints.up('md'))

  return (
    <Box
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      animate={{ opacity: isMdScreen ? 1 : controls.sidebar ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className={cx(
        'sidebar absolute z-10 flex h-full flex-col justify-between rounded-none border-0 border-r px-4 py-8 md:relative',
        {
          'before:hidden': isMdScreen,
          'pointer-events-none': !isMdScreen && !controls.sidebar,
        },
      )}
      FadeInOut={{ component: 'div' }}
      component={FadeInOut}
    >
      <div className="sidebar-nav">
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
            onClick={() => {
              controls.setSidebar(false)
            }}
          >
            <item.Icon className="mb-1" size={24} />
            <span>{item.title}</span>
          </Link>
        ))}
      </div>
      <div className="sidebar-controls text-center">
        <ThemeSelector />
      </div>
    </Box>
  )
}
