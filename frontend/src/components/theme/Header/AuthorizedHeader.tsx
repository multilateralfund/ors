/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import { useState } from 'react'

import { Box } from '@mui/material'
import cx from 'classnames'
import { AnimatePresence } from 'framer-motion'
import { DebouncedFunc, debounce, isFunction } from 'lodash'
import { usePathname, useRouter } from 'next/navigation'

// import CollapseInOut from '@ors/components/manage/Transitions/CollapseInOut'
import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Logo from '@ors/components/theme/Logo/Logo'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
// import ThemeSelector from '@ors/components/theme/ThemeSelector/ThemeSelector'
import UnstyledLink, { LinkProps } from '@ors/components/ui/Link/Link'
import { matchPath } from '@ors/helpers/Url/Url'
import { useStore } from '@ors/store'

import { IoChevronDown } from 'react-icons/io5'

function Link({
  children,
  className,
  href,
  path,
  ...rest
}: LinkProps & { path?: string }) {
  const pathname = usePathname()
  const active = !!matchPath(path || href, pathname || '')

  return (
    <UnstyledLink
      className={cx(
        'align-center flex rounded-lg px-4 py-2 font-bold no-underline theme-dark hover:outline hover:outline-1 hover:outline-typography-primary',
        {
          'bg-primary text-mlfs-hlYellow': active,
          'bg-white text-primary': !active,
        },
        className,
      )}
      href={href}
      style={{ boxShadow: '0px 10px 10px 0px rgba(0, 0, 0, 0.15)' }}
      {...rest}
    >
      {children}
    </UnstyledLink>
  )
}

const HeaderNavigation = () => {
  const [showMenu, setShowMenu] = useState<Record<string, boolean>>({})
  const [hideInProgress, setHideInProgress] =
    useState<DebouncedFunc<any> | null>(null)

  const handleShowMenu = (label: string) => {
    hideInProgress?.cancel()
    setShowMenu(() => ({ [label]: true }))
  }

  const handleHideAllMenus = () => {
    const eta = debounce(() => setShowMenu(() => ({})), 300)
    setHideInProgress(() => eta)
    eta()
  }

  const baseUrl = 'https://prod.multilateralfund.edw.ro'

  const items = [
    {
      label: 'About MLF',
      menu: [
        { label: 'Governance', url: '/about/governance' },
        { label: 'History', url: '/about/history' },
        { label: 'Mission', url: '/about/mission' },
        {
          label: 'Monitoring & Evaluation',
          url: '/about/monitoring-evaluation',
        },
        { label: 'Partners', url: '/about/partners' },
        { label: 'Secretariat', url: '/about/secretariat' },
      ],
      url: '/about/',
    },
    { label: 'Our impact', url: '/our-impact' },
    {
      label: 'Projects & Data',
      menu: [
        {
          label: 'Countries Dashboard',
          url: '/projects-data/countries-dashboard',
        },
        { label: 'Funding Dashboard', url: '/projects-data/funding-dashboard' },
        {
          label: 'People & Environment',
          url: '/projects-data/people-environment',
        },
        {
          label: 'Projects Dashboard',
          url: '/projects-data/projects-dashboard',
        },
      ],
      url: '/projects-data',
    },
    {
      label: 'Resources',
      menu: [
        { label: 'Decision handbook', url: '/resources/decisions' },
        {
          label: 'Project Guides & Tools',
          url: '/resources/project-guides-tools',
        },
        { label: 'Scorecards', url: '/resources/secretariat-scorecards' },
      ],
      url: '/resources',
    },
    { label: 'Meetings', url: '/meetings' },
    { label: 'News & Stories', url: '/news-stories' },
  ]

  return (
    <div
      className="flex gap-x-4 rounded-full bg-white px-5 py-3 font-medium shadow-lg"
      onMouseLeave={handleHideAllMenus}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="relative flex cursor-pointer text-primary"
        >
          <a
            className="flex items-center justify-between gap-x-2 rounded-full px-4 py-2 text-lg text-primary no-underline hover:bg-primary hover:text-mlfs-hlYellow"
            href={`${baseUrl}${item.url}`}
            onMouseEnter={() => handleShowMenu(item.label)}
          >
            {item.label}
            {item.menu && <IoChevronDown />}
          </a>
          {showMenu[item.label] && (
            <FadeInOut className="absolute left-0 z-10">
              <div
                className="absolute top-12 z-10 mt-2 flex w-48 flex-col rounded-lg bg-white shadow-lg"
                onMouseLeave={handleHideAllMenus}
                onMouseOver={() => handleShowMenu(item.label)}
              >
                {item.menu?.map((menuItem) => (
                  <a
                    key={menuItem.label}
                    className="border-2 border-l-0 border-r-0 border-t-0 border-solid border-b-sky-400 px-4 py-2 text-primary no-underline transition-all first:rounded-t-lg last:rounded-b-lg last:border-b-0 hover:bg-mlfs-hlYellowTint"
                    href={`${baseUrl}${item.url}`}
                  >
                    {menuItem.label}
                  </a>
                ))}
              </div>
            </FadeInOut>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()

  const { HeaderTitle, navigationBackground } = useStore(
    (state) => state.header,
  )

  const navSections = [
    { current: false, label: 'Country programmes', url: '/country-programme' },
    { current: false, label: 'Business plans', url: '/business-plans' },
    {
      current: false,
      label: 'Project submissions',
      url: '/project-submissions',
    },
    { current: false, label: 'Projects', url: '/projects' },
  ].map((section) => ({
    ...section,
    current: !!matchPath(`${section.url}/*`, pathname || ''),
  }))

  const currentSection =
    navSections.filter((section) => section.current)[0]?.label || 'Home'

  return (
    <FadeInOut className="header-motion">
      <Box
        id="header"
        className="rounded-none border-0 px-0 pb-0 pt-4 shadow-none"
        component="nav"
        style={{ backgroundColor: '#e6f4fb' }}
      >
        <div className="container flex w-full items-center justify-between pb-4">
          <div className="flex w-full flex-auto items-center justify-between gap-x-8 ">
            <UnstyledLink href="/">
              <Logo className="h-[100px] w-[160px] md:w-[240px]" />
            </UnstyledLink>
            <HeaderNavigation />
          </div>
        </div>
        <Box
          className={'relative -mt-2 rounded-none border-0 p-0 shadow-none'}
          style={{ backgroundColor: 'hsla(210, 20%, 98%, 1)' }}
        >
          <div
            className="absolute top-0 h-6 w-full"
            style={{ backgroundColor: '#e6f4fb' }}
          ></div>
          <div className="container relative">
            <Dropdown
              className="-mt-2 md:hidden"
              MenuProps={{ classes: { list: 'py-2' } }}
              label={
                <div className="flex items-center justify-between gap-x-4 rounded-xl bg-primary px-4 py-2 text-center text-xl font-bold text-mlfs-hlYellow">
                  {currentSection}
                  <IoChevronDown />
                </div>
              }
            >
              {navSections.map((section, idx) => {
                return (
                  <Dropdown.Item key={idx}>
                    <Link
                      className="text-xl"
                      href={section.url}
                      path={`${section.url}/*`}
                    >
                      {section.label}
                    </Link>
                  </Dropdown.Item>
                )
              })}
            </Dropdown>
            <div
              id="header-nav"
              className="hidden flex-wrap gap-x-8 gap-y-4 md:flex"
            >
              {navSections.map((section, idx) => {
                return (
                  <Link key={idx} href={section.url} path={`${section.url}/*`}>
                    {section.label}
                  </Link>
                )
              })}
            </div>
            <div id="header-title">
              <AnimatePresence>
                {isFunction(HeaderTitle) && <HeaderTitle />}
                {!!HeaderTitle && !isFunction(HeaderTitle) && HeaderTitle}
              </AnimatePresence>
            </div>
          </div>
        </Box>
      </Box>
    </FadeInOut>
  )
}
