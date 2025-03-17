import usePageTitle from '@ors/hooks/usePageTitle'

import LoginForm from '@ors/components/theme/Forms/LoginForm/LoginForm'
import Logo from '@ors/components/theme/Logo/Logo'
import PageWrapper from '@ors/components/theme/PageWrapper/PageWrapper'

export default function Login() {
  usePageTitle('Login')
  return (
    <PageWrapper
      className="mx-auto flex max-w-[22rem] flex-col items-center justify-center sm:w-96 sm:max-w-screen-sm"
      defaultSpacing={false}
      fill
    >
      <Logo className="mb-5" variant="white" />
      <LoginForm />
    </PageWrapper>
  )
}
