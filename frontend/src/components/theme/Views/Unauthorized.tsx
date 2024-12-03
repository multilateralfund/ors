'use client'
import { Button, Typography } from '@mui/material'
// import { useRouter } from 'next/router'

import FadeInOut from '@ors/components/manage/Transitions/FadeInOut'
import Error from '@ors/components/theme/Error/Error'

export default function Unauthorized() {
  // const router = useRouter()

  return (
    <FadeInOut className="h-full w-full">
      <Error statusCode="401">
        <Typography className="mb-8 text-center font-bold" variant="h6">
          You do not have permissions to view this resource.
        </Typography>
        <Button
          className="block w-full"
          href="/login"
          variant="contained"
          // onClick={() => {
          //   router.back()
          // }}
        >
          Back
        </Button>
      </Error>
    </FadeInOut>
  )
}
