'use client'
import { Box } from '@mui/material'
import cx from 'classnames'
import { AnimatePresence } from 'framer-motion'
import { isFunction } from 'lodash'
import { usePathname } from 'next/navigation'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Logo from '@ors/components/theme/Logo/Logo'
import ProfileDropdown from '@ors/components/theme/Profile/ProfileDropdown'
// import ThemeSelector from '@ors/components/theme/ThemeSelector/ThemeSelector'
import UnstyledLink, { LinkProps } from '@ors/components/ui/Link/Link'
import { formatApiUrl } from '@ors/helpers/Api/Api'
import { matchPath } from '@ors/helpers/Url/Url'
import useStore from '@ors/store'

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
        'font-bold no-underline theme-dark hover:text-white ltr:mr-8 rtl:ml-8',
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
    <Box
      id="header"
      className="mb-4 rounded-none border-0 px-0 pb-0 pt-4"
      FadeInOut={{ component: 'nav' }}
      component={FadeInOut}
    >
      <div className="container flex w-full items-center justify-between pb-4">
        <Link className="logo mb-0 flex items-center" href="/" underline="none">
          <Logo />
          <span className="font-bold ltr:ml-4 rtl:mr-4">Data portal</span>
        </Link>
        <div>
          {/* <LanguageSelector className="ltr:mr-2 rtl:ml-2" /> */}
          <Link href={formatApiUrl('/admin/')}>Admin</Link>
          <ProfileDropdown className="ltr:mr-2 rtl:ml-2" />
          {/* <ThemeSelector /> */}
          <div id="header-control" />
        </div>
      </div>
      <Box
        className={'rounded-none border-0 shadow-none'}
        style={{ backgroundColor: navigationBackground }}
      >
        <div className="container">
          <div id="header-nav">
            <Link href="/business-plans" path="/business-plans/*">
              Business plans
            </Link>
            <Link href="/submissions" path="/submissions/*">
              Submissions
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
              {!!HeaderTitle && HeaderTitle}
            </AnimatePresence>
          </div>
        </div>
      </Box>
    </Box>
  )
}
