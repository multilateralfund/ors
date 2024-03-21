'use client'
import { Box } from '@mui/material'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Link from '@ors/components/ui/Link/Link'

import Logo from '../Logo/Logo'

export default function Header() {
  return (
    <FadeInOut className="header-motion">
      <Box id="header" className="rounded-none border-0 px-0 pb-0 pt-4">
        <div className="container flex w-full items-center justify-between pb-4">
          <div className="flex items-center gap-x-6 md:gap-x-8">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <div>
            <div id="header-control" />
          </div>
        </div>
      </Box>
    </FadeInOut>
  )
}
