import { Typography } from '@mui/material'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Error from '@ors/components/theme/Error/Error'

export default function NotFound() {
  return (
    <FadeInOut className="h-full w-full">
      <Error statusCode="400">
        <Typography className="text-center font-bold" variant="h6">
          Resource not found
        </Typography>
      </Error>
    </FadeInOut>
  )
}
