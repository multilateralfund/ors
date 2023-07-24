import { Box, Link } from '@mui/material'
import Image from 'next/image'

import {
  FadeInOut,
  LanguageSelector,
  ProfileDropdown,
  ThemeSelector,
} from '@ors/components'

export default function Header() {
  return (
    <Box
      id="header"
      className="rounded-none border-0 border-b"
      FadeInOut={{ component: 'nav' }}
      component={FadeInOut}
    >
      <div className="flex w-full justify-between">
        <Link className="logo mb-0 flex items-center" href="/" underline="none">
          <Image
            alt="Multilateral Fund"
            height={40}
            src="/assets/logos/mlf_icon.png"
            width={40}
            priority
          />
          <span className="pl-2 dark:text-white">MLFS</span>
        </Link>
        <div className="flex">
          <LanguageSelector className="mr-2" />
          <ProfileDropdown />
          <ThemeSelector />
        </div>
      </div>
    </Box>
  )
}
