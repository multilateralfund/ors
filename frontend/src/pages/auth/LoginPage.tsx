import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import { object, string, TypeOf } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { useLoginMutation } from '@/services/api'
import { Button } from '@/components/shared/Button'
import { Logo } from '@/components/shared/Logo'
import { FormInput } from '@/components/form/FormInput'

const loginSchema = object({
  username: string().min(1, 'Username is required'),
  password: string()
    .min(1, 'Password is required')
    .min(8, 'Password must be more than 8 characters')
    .max(32, 'Password must be less than 32 characters'),
})

export type LoginInput = TypeOf<typeof loginSchema>

export const LoginPage = () => {
  const methods = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const [loginUser, { isLoading, isError, error, isSuccess }] =
    useLoginMutation()

  const navigate = useNavigate()
  const location = useLocation()

  const from = ((location.state as any)?.from.pathname as string) || '/profile'

  const {
    reset,
    handleSubmit,
    formState: { isSubmitSuccessful },
  } = methods

  useEffect(() => {
    if (isSuccess) {
      toast.success('You successfully logged in')
      navigate(from)
    }

    if (isError) {
      if (error.status === 400) {
        toast.error('Unable to log in with provided credentials.', {
          position: 'top-right',
        })
      }
    }
  }, [isLoading])

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset()
    }
  }, [isSubmitSuccessful])

  const onSubmit: SubmitHandler<LoginInput> = values => {
    loginUser(values)
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
      <Logo />
      <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
            Sign in to your account
          </h1>
          <FormProvider {...methods}>
            <form
              className="space-y-4 md:space-y-6"
              onSubmit={handleSubmit(d => onSubmit(d))}
            >
              <FormInput
                label="Username"
                name="username"
                placeholder="type your username"
              />
              <FormInput
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
              />
              <div className="flex justify-end">
                <a
                  href="/forgot-password"
                  className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
                >
                  Forgot password?
                </a>
              </div>
              <Button className="w-full" type="submit" disabled={isLoading}>
                Sign in
              </Button>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  )
}
