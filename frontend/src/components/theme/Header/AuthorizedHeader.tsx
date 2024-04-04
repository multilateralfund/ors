/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { Box } from '@mui/material'
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

  return (
    <FadeInOut className="header-motion">
      <Box
        id="header"
        className="rounded-none border-0 px-0 pb-0 pt-4 shadow-none"
        component="nav"
      >
        <div className="container flex w-full items-center justify-between pb-4">
          <div className="flex w-full flex-auto items-center justify-between gap-x-8 ">
            <UnstyledLink href="/">
              <Logo className="h-[100px] w-[160px] md:w-[240px]" />
            </UnstyledLink>
            <HeaderNavigation />
          </div>
        </div>
        <div className="container relative">
          <div id="header-title">
            <AnimatePresence>
              {isFunction(HeaderTitle) && <HeaderTitle />}
              {!!HeaderTitle && !isFunction(HeaderTitle) && HeaderTitle}
            </AnimatePresence>
          </div>
        </div>
      </Box>
    </FadeInOut>
  )
}
