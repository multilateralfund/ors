/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import { Box, Button, Divider, Typography } from '@mui/material'
import cx from 'classnames'
import { AnimatePresence } from 'framer-motion'
import { isFunction } from 'lodash'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

// import CollapseInOut from '@ors/components/manage/Transitions/CollapseInOut'
import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Logo from '@ors/components/theme/Logo/Logo'
import ProfileDropdown from '@ors/components/theme/Profile/ProfileDropdown'
import Dropdown from '@ors/components/ui/Dropdown/Dropdown'
// import ThemeSelector from '@ors/components/theme/ThemeSelector/ThemeSelector'
import UnstyledLink, { LinkProps } from '@ors/components/ui/Link/Link'
import { formatApiUrl } from '@ors/helpers/Api/Api'
import { matchPath } from '@ors/helpers/Url/Url'
import { useStore } from '@ors/store'

import { IoChevronDown, IoSettingsOutline } from 'react-icons/io5'

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
          <div className="flex items-center gap-x-8">
            <UnstyledLink href="/">
              <Logo className="h-[100px] w-[160px] md:w-[240px]" />
            </UnstyledLink>
            <Divider
              className="my-5 border-secondary md:border-2"
              orientation="vertical"
              variant="middle"
              flexItem
            />
            <Typography
              className="text-5xl font-bold leading-none text-typography-secondary md:text-6xl"
              component="p"
            >
              Data portal
            </Typography>
          </div>
          <div className="self-baseline md:self-auto">
            {/* <LanguageSelector className="ltr:mr-2 rtl:ml-2" /> */}
            <UnstyledLink
              className="hidden theme-dark:text-white md:inline-block"
              href={formatApiUrl('/admin/')}
              button
            >
              <div className="flex flex-row items-center justify-between gap-x-2 text-xl font-normal uppercase">
                <IoSettingsOutline className="text-secondary" />
                Admin
              </div>
            </UnstyledLink>
            <ProfileDropdown className="md:p-auto md:min-w-auto mr-0 min-w-0 pr-0 md:m-auto ltr:mr-2 rtl:ml-2" />
            {/* {__DEVELOPMENT__ && <ThemeSelector />} */}
            <div id="header-control" />
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
