import { Typography } from '@mui/material'

import FadeInOut from '@ors/components/manage/Utils/FadeInOut'
import Error from '@ors/components/theme/Error/Error'

export default function Econnrefused() {
  return (
    <FadeInOut>
      <Error statusCode="ECONNREFUSED">
        <Typography className="mb-2 mt-8 font-normal" variant="h6">
          Connection to the server could not be established.
        </Typography>
        <Typography className="font-bold" variant="h6">
          We are working on fixing the issue!
        </Typography>
      </Error>
    </FadeInOut>
  )
}
