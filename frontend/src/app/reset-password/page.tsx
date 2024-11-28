import { useEffect } from 'react'

import ResetPasswordForm from '@ors/components/theme/Forms/ResetPasswordForm/ResetPasswordForm'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function ResetPassword() {
  useEffect(function () {
    document.title = 'Reset password'
  }, [])
  return (
    <PageWrapper
      className="mx-auto flex w-full max-w-screen-sm flex-col items-center justify-center"
      defaultSpacing={false}
      fill
    >
      <ResetPasswordForm />
    </PageWrapper>
  )
}
