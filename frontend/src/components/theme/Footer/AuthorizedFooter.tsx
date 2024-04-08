import { Box } from '@mui/material'
import cx from 'classnames'
import { Roboto_Condensed } from 'next/font/google'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Logo from '@ors/components/theme/Logo/Logo'

const robotoCondensed = Roboto_Condensed({
  display: 'swap',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
})

const EXTERNAL_BASE_URL = 'https://prod.multilateralfund.edw.ro'
const makeExternalUrl = (path: string) => `${EXTERNAL_BASE_URL}${path}`

const FooterLinks = () => {
  const items = [
    { label: 'Careers', url: makeExternalUrl('/') },
    { label: 'Contact us', url: makeExternalUrl('/') },
    { label: 'Privacy policy', url: makeExternalUrl('/') },
    { label: 'Terms of service', url: makeExternalUrl('/') },
  ]
  return (
    <div
      className={cx(
        'flex flex-col items-center gap-x-8 gap-y-8 text-nowrap text-xl font-normal lg:flex-row',
        robotoCondensed.className,
      )}
    >
      {items.map((item) => (
        <a
          key={item.label}
          className="block rounded-full border border-solid border-mlfs-hlYellow px-4 uppercase text-mlfs-hlYellow no-underline hover:bg-black"
          href={item.url}
          target="_blank"
        >
          {item.label}
        </a>
      ))}
    </div>
  )
}

export default function Footer() {
  return (
    <FadeInOut>
      <Box
        id="footer"
        className="flex h-auto w-full items-center rounded-none border-0 bg-mlfs-deepTealShade shadow-none"
      >
        <div className="container w-full">
          <div className="flex flex-col items-center justify-center gap-x-72 gap-y-14 py-12 md:flex-row md:gap-y-0">
            <Logo className="min-w-[260px]" variant="white" />
            <FooterLinks />
          </div>
        </div>
      </Box>
    </FadeInOut>
  )
}
