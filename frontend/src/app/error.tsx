// 'use client'
//
// import React, { useEffect } from 'react'
//
// import { Button, Typography } from '@mui/material'
// import * as Sentry from '@sentry/nextjs'
//
// import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
//
// export default function Error({
//   error,
//   reset,
// }: {
//   error: { digest?: string } & Error
//   reset: () => void
// }) {
//
//   useEffect(() => {
//     Sentry.captureException(error)
//   }, [error])
//
//   return (
//     <PageWrapper
//       className="mx-auto flex h-screen w-96 max-w-screen-sm flex-col items-center gap-y-4 p-12"
//       defaultSpacing={false}
//     >
//       <Typography className="text-3xl">Something went wrong!</Typography>
//       <div className="flex gap-x-4">
//         <Button
//           className="rounded-lg border-[1.5px] border-solid border-primary px-3 py-2.5 text-base"
//           onClick={() => reset()}
//         >
//           Try again
//         </Button>
//         <Button
//           className="rounded-lg border-[1.5px] border-solid border-primary px-3 py-2.5 text-base"
//           onClick={() => history.go(-1)}
//         >
//           Go back
//         </Button>
//       </div>
//     </PageWrapper>
//   )
// }
