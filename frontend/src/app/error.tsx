'use client'

import React from 'react'

import { Button, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'

import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function Error({ reset }: { reset: () => void }) {
  const router = useRouter()

  return (
    <PageWrapper
      className="mx-auto flex h-screen w-96 max-w-screen-sm flex-col items-center gap-y-4 p-12"
      defaultSpacing={false}
    >
      <Typography className="text-3xl">Something went wrong!</Typography>
      <div className="flex gap-x-4">
        <Button
          className="rounded-lg border-[1.5px] border-solid border-primary px-3 py-2.5 text-base"
          onClick={() => reset()}
        >
          Try again
        </Button>
        <Button
          className="rounded-lg border-[1.5px] border-solid border-primary px-3 py-2.5 text-base"
          onClick={() => router.back()}
        >
          Go back
        </Button>
      </div>
    </PageWrapper>
  )
}
