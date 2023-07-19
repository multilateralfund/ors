import Image from 'next/image'
import Link from 'next/link'

import Box from '@mui/material/Box'
import LanguageSelector from '@ors/components/theme/LanguageSelector/LanguageSelector'
import ProfileDropdown from '@ors/components/theme/Profile/ProfileDropdown'
import ThemeSelector from '@ors/components/theme/ThemeSelector/ThemeSelector'

export default function Header() {
  return (
    <Box id="header" component="nav" className="border-0 border-b">
      <div className="flex w-full justify-between">
        <Link href="/" className="logo flex items-center no-underline">
          <Image
            src="/assets/logos/mlf_icon.png"
            alt="Multilateral Fund"
            width={40}
            height={40}
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
