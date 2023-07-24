import { Logo, PageWrapper, ResetPasswordForm } from '@ors/components'

export default function ChangePassword() {
  return (
    <PageWrapper
      className="mx-auto flex w-full max-w-screen-sm flex-col items-center justify-center"
      fill
    >
      <Logo />
      <ResetPasswordForm endpoint="/api/auth/password/change/" />
    </PageWrapper>
  )
}
