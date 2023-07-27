import ResetPasswordForm from '@ors/components/theme/Forms/ResetPasswordForm/ResetPasswordForm'
import Logo from '@ors/components/theme/Logo/Logo'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

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
