import { Typography } from '@mui/material'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Error from '@ors/components/theme/Error/Error'
import Link from '@ors/components/ui/Link/Link'

export default function Forbidden() {
  return (
    <FadeInOut className="h-full w-full">
      <Error statusCode="403">
        <Typography className="mb-8 text-center font-bold" variant="h6">
          You do not have permissions to view this resource
        </Typography>
        <Link className="block w-full" href="/login" variant="contained" button>
          Login
        </Link>
      </Error>
    </FadeInOut>
  )
}
