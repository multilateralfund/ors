import { Box } from '@mui/material'
import cx from 'classnames'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Logo from '@ors/components/theme/Logo/Logo'
import { useStore } from '@ors/store'

const EXTERNAL_BASE_URL = 'https://prod.multilateralfund.edw.ro'
const makeExternalUrl = (path: string) => `${EXTERNAL_BASE_URL}${path}`

const FooterLinks = () => {
  const user = useStore((state) => state.user)
  const items = [
    { label: 'Careers', url: makeExternalUrl('/') },
    { label: 'Contact us', url: makeExternalUrl('/') },
    // { label: 'Privacy policy', url: makeExternalUrl('/') },
    // { label: 'Terms of service', url: makeExternalUrl('/') },
  ]
  return (
    <div
      className={cx(
        'flex flex-col items-center gap-x-8 gap-y-8 text-nowrap text-xl font-normal lg:flex-row',
      )}
    >
      {items.map((item) => (
        <a
          key={item.label}
          className="block rounded-full border border-solid border-mlfs-hlYellow bg-transparent px-4 uppercase text-mlfs-hlYellow no-underline transition-all hover:bg-black"
          href={item.url}
        >
          {item.label}
        </a>
      ))}
      {false && (
        <button
          className={cx(
            'cursor-pointer text-nowrap rounded-full border border-solid border-mlfs-hlYellow bg-transparent px-4 py-0 text-xl font-normal uppercase text-mlfs-hlYellow no-underline transition-all hover:bg-black',
          )}
          onClick={async () => {
            await user.logout()
          }}
        >
          Logout
        </button>
      )}
    </div>
  )
}

export default function Footer() {
  return (
    <FadeInOut>
      <Box
        id="footer"
        className="flex h-auto w-full items-center rounded-none border-0 bg-mlfs-deepTealShade shadow-none print:hidden"
      >
        <div className="container w-full">
          <div className="flex flex-col items-center justify-center gap-x-72 gap-y-14 py-12 md:flex-row md:gap-y-0">
            <Logo className="min-w-[260px]" variant="white" />
            <div className="flex flex-col justify-between gap-y-8">
              <FooterLinks />
              <a
                className="text-lg font-light uppercase text-white no-underline"
                href={makeExternalUrl('/terms-use')}
              >
                Terms of use
              </a>
            </div>
          </div>
        </div>
      </Box>
    </FadeInOut>
  )
}
