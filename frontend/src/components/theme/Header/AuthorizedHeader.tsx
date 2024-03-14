/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'
import { Box, Divider, Typography } from '@mui/material'
import cx from 'classnames'
import { AnimatePresence } from 'framer-motion'
import { isFunction } from 'lodash'
import { usePathname } from 'next/navigation'

// import CollapseInOut from '@ors/components/manage/Transitions/CollapseInOut'
import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Logo from '@ors/components/theme/Logo/Logo'
import ProfileDropdown from '@ors/components/theme/Profile/ProfileDropdown'
// import ThemeSelector from '@ors/components/theme/ThemeSelector/ThemeSelector'
import UnstyledLink, { LinkProps } from '@ors/components/ui/Link/Link'
import { formatApiUrl } from '@ors/helpers/Api/Api'
import { matchPath } from '@ors/helpers/Url/Url'
import { useStore } from '@ors/store'

import { IoSettingsOutline } from 'react-icons/io5'

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
        'font-bold no-underline theme-dark hover:text-white',
        { 'text-typography-secondary': !active, 'text-white': active },
        className,
      )}
      href={href}
      {...rest}
    >
      {children}
    </UnstyledLink>
  )
}

export default function Header() {
  const { HeaderTitle, navigationBackground } = useStore(
    (state) => state.header,
  )

  return (
    <FadeInOut className="header-motion">
      <Box
        id="header"
        className="rounded-none border-0 px-0 pb-0 pt-4"
        component="nav"
        style={{ backgroundColor: '#e6f4fb' }}
      >
        <div className="container flex w-full items-center justify-between pb-4">
          <div className="flex items-center gap-x-8">
            <UnstyledLink href="/">
              <Logo />
            </UnstyledLink>
            <Divider
              className="my-5 border-2 border-secondary"
              orientation="vertical"
              variant="middle"
              flexItem
            />
            <Typography
              className="hidden text-typography-secondary md:block"
              component="p"
              variant="h1"
            >
              Data portal
            </Typography>
          </div>
          <div>
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
            <ProfileDropdown className="ltr:mr-2 rtl:ml-2" />
            {/* {__DEVELOPMENT__ && <ThemeSelector />} */}
            <div id="header-control" />
          </div>
        </div>
        <Box
          className={'rounded-none border-0 shadow-none'}
          style={{ backgroundColor: navigationBackground }}
        >
          <div className="container">
            <div id="header-nav" className="flex flex-wrap gap-x-8 gap-y-4">
              <Link href="/business-plans" path="/business-plans/*">
                Business plans
              </Link>
              <Link href="/project-submissions" path="/project-submissions/*">
                Project submissions
              </Link>
              <Link href="/projects" path="/projects/*">
                Projects
              </Link>
              <Link href="/country-programme" path="/country-programme/*">
                Country programme
              </Link>
              <Link href="/enterprises" path="/enterprises/*">
                Enterprises
              </Link>
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
