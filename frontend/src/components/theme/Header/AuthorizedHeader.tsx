/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { AnimatePresence } from 'framer-motion'
import { isFunction } from 'lodash'

// import CollapseInOut from '@ors/components/manage/Transitions/CollapseInOut'
import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Logo from '@ors/components/theme/Logo/Logo'
// import ThemeSelector from '@ors/components/theme/ThemeSelector/ThemeSelector'
import UnstyledLink from '@ors/components/ui/Link/Link'
import { useStore } from '@ors/store'

import HeaderNavigation from './HeaderNavigation'

export default function Header() {
  const { HeaderTitle } = useStore((state) => state.header)
  const currentPath =
    typeof window !== 'undefined' ? window.location.pathname : ''

  return (
    <FadeInOut className="header-motion">
      <nav
        id="header"
        className="rounded-none border-0 from-white to-gray-900 px-0 pb-0 pt-4 shadow-none"
      >
        <div className="container flex w-full items-center justify-between pb-4">
          <div className="flex w-full flex-auto items-center justify-center gap-x-8 ">
            <UnstyledLink href="/">
              <Logo className="min-w-[240px]" />
            </UnstyledLink>
            <HeaderNavigation />
          </div>
        </div>
        <div className="container relative">
          <div
            id="header-title"
            className={`${currentPath === '/country-programme' ? 'mx-auto max-w-screen-xl' : ''}`}
          >
            <AnimatePresence>
              {isFunction(HeaderTitle) && <HeaderTitle />}
              {!!HeaderTitle && !isFunction(HeaderTitle) && HeaderTitle}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </FadeInOut>
  )
}
