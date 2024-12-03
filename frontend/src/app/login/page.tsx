import usePageTitle from '@ors/hooks/usePageTitle'

import LoginForm from '@ors/components/theme/Forms/LoginForm/LoginForm'
import Logo from '@ors/components/theme/Logo/Logo'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function Login() {
  usePageTitle('Login')
  return (
    <PageWrapper
      className="mx-auto flex w-96 max-w-screen-sm flex-col items-center justify-center"
      defaultSpacing={false}
      fill
    >
      <Logo className="mb-5" variant="white" />
      <LoginForm />
    </PageWrapper>
  )
}
