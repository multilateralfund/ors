import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'
import ResetPasswordForm from '@ors/components/theme/ResetPasswordForm/ResetPasswordForm'

export default function ChangePassword() {
  return (
    <PageWrapper className="mx-auto flex h-full w-full max-w-screen-sm flex-col items-center justify-center px-4">
      <ResetPasswordForm endpoint="/api/auth/password/change/" />
    </PageWrapper>
  )
}
