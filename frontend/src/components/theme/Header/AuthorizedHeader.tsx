'use client'
import { Box } from '@mui/material'
import cx from 'classnames'
import { usePathname } from 'next/navigation'

import FadeInOut from '@ors/components/manage/Utils/FadeInOut'
import LanguageSelector from '@ors/components/theme/LanguageSelector/LanguageSelector'
import Logo from '@ors/components/theme/Logo/Logo'
import ProfileDropdown from '@ors/components/theme/Profile/ProfileDropdown'
import ThemeSelector from '@ors/components/theme/ThemeSelector/ThemeSelector'
import UnstyledLink, { LinkProps } from '@ors/components/ui/Link'
import { matchPath } from '@ors/helpers/Url/Url'

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
  return (
    <Box
      id="header"
      className="rounded-none border-0 px-0 pb-0 pt-4"
      FadeInOut={{ component: 'nav' }}
      component={FadeInOut}
    >
      <div className="container flex w-full items-center justify-between pb-4">
        <Link className="logo mb-0 flex items-center" href="/" underline="none">
          <Logo />
        </Link>
        <div>
          <LanguageSelector className="ltr:mr-2 rtl:ml-2" />
          <ProfileDropdown className="ltr:mr-2 rtl:ml-2" />
          <ThemeSelector />
          <div id="header-control" />
        </div>
      </div>
      <Box className="rounded-none border-0 bg-primary shadow-none">
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
            <Link href="/reports" path="/reports/*">
              Country programme
            </Link>
            <Link href="/enterprises" path="/enterprises/*">
              Enterprises
            </Link>
          </div>
          <div id="header-title" />
        </div>
      </Box>
    </Box>
  )
}
