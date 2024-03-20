import { Box } from '@mui/material'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Logo from '@ors/components/theme/Logo/Logo'

export default function Footer() {
  return (
    <FadeInOut>
      <Box
        id="footer"
        className="flex h-48 w-full items-center rounded-none border-0 bg-mlfs-deepTealShade shadow-none"
      >
        <div className="container w-full">
          <div className="flex items-center">
            <Logo variant="white" />
          </div>
        </div>
      </Box>
    </FadeInOut>
  )
}
