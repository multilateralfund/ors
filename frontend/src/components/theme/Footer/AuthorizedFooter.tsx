import { Box } from '@mui/material'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'

export default function Footer() {
  return (
    <FadeInOut className="not-printable">
      <Box
        id="footer"
        className={
          'h-[240px] w-full rounded-none border-0 bg-primary shadow-none'
        }
      />
    </FadeInOut>
  )
}
