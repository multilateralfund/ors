import ForgotPasswordForm from '@ors/components/theme/Forms/ForgotPasswordForm/ForgotPasswordForm'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

// export const metadata: Metadata = {
//   title: 'Reset password',
// }

export default function ForgotPassword() {
  return (
    <PageWrapper
      className="mx-auto flex w-full max-w-screen-sm flex-col items-center justify-center"
      defaultSpacing={false}
      fill
    >
      <ForgotPasswordForm />
    </PageWrapper>
  )
}
