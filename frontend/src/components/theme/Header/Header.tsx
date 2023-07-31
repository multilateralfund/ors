import { Box } from '@mui/material'
import Image from 'next/image'

import FadeInOut from '@ors/components/manage/Utils/FadeInOut'
import LanguageSelector from '@ors/components/theme/LanguageSelector/LanguageSelector'
import ProfileDropdown from '@ors/components/theme/Profile/ProfileDropdown'
import ThemeSelector from '@ors/components/theme/ThemeSelector/ThemeSelector'
import Link from '@ors/components/ui/Link'

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
          <span className="theme-dark:text-white ltr:pl-2 rtl:pr-2">MLFS</span>
          <span className="theme-dark:text-white ltr:pl-2 rtl:pr-2">
            V{process.env.NEXT_PUBLIC_VERSION}
          </span>
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
