import Image from 'next/image'
import Link from 'next/link'

import LanguageSelector from '@ors/components/theme/LanguageSelector/LanguageSelector'
import ProfileDropdown from '@ors/components/theme/Profile/ProfileDropdown'

export default function Header() {
  return (
    <nav
      id="header"
      className="border-b border-solid border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex w-full justify-between p-4">
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
          <LanguageSelector />
          <ProfileDropdown />
        </div>
      </div>
    </nav>
  )
}
