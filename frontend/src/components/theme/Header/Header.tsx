import { Box } from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'

import FadeInOut from '@ors/components/manage/Utils/FadeInOut'
import LanguageSelector from '@ors/components/theme/LanguageSelector/LanguageSelector'
import ProfileDropdown from '@ors/components/theme/Profile/ProfileDropdown'
import ThemeSelector from '@ors/components/theme/ThemeSelector/ThemeSelector'

export default function Header() {
  return (
    <Box
      id="header"
      className="border-0 border-b"
      FadeInOut={{ component: 'nav' }}
      component={FadeInOut}
    >
      <div className="flex w-full justify-between">
        <Link className="logo flex items-center no-underline" href="/">
          <Image
            alt="Multilateral Fund"
            height={40}
            src="/assets/logos/mlf_icon.png"
            width={40}
            priority
          />
          <span className="pl-2">MLFS</span>
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
