import usePageTitle from '@ors/hooks/usePageTitle'

import ResetPasswordForm from '@ors/components/theme/Forms/ResetPasswordForm/ResetPasswordForm'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function ResetPassword() {
  usePageTitle('Reset password')

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
