'use client'
import { Box } from '@mui/material'
import cx from 'classnames'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import ProfileDropdown from '@ors/components/theme/Profile/ProfileDropdown'
// import ThemeSelector from '@ors/components/theme/ThemeSelector/ThemeSelector'
import UnstyledLink, { LinkProps } from '@ors/components/ui/Link/Link'
import { formatApiUrl } from '@ors/helpers/Api/Api'
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
          <Image
            alt="Multilateral Fund"
            height={40}
            src="/assets/logos/mlf_icon.png"
            width={40}
            priority
          />
          <span className="theme-dark:text-white ltr:pl-2 rtl:pr-2">MLFS</span>
        </Link>
        <div>
          {/* <LanguageSelector className="ltr:mr-2 rtl:ml-2" /> */}
          <Link href={formatApiUrl('/admin/')}>Admin</Link>
          <ProfileDropdown className="ltr:mr-2 rtl:ml-2" />
          {/* <ThemeSelector /> */}
          <div id="header-control" />
        </div>
      </div>
    </Box>
  )
}
