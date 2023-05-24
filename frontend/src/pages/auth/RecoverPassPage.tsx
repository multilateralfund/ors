import { useEffect } from 'react'
import { Button } from 'flowbite-react'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import { object, string, TypeOf } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { useForgotPasswordMutation } from '@/services/api'
import { FormInput } from '@/components/form/FormInput'
import { Logo } from '@/components/shared/Logo'

const forgotPasswordSchema = object({
  email: string()
    .min(1, 'Email address is required')
    .email('Email Address is invalid'),
})

export type ForgotPasswordInput = TypeOf<typeof forgotPasswordSchema>

export function RecoverPassPage() {
  const methods = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const [forgotPassword, { isLoading, isError, error, isSuccess, data }] =
    useForgotPasswordMutation()

  const {
    reset,
    handleSubmit,
    formState: { isSubmitSuccessful },
  } = methods

  useEffect(() => {
    if (isSuccess) {
      toast.success(data)
    }

    if (isError) {
      if (error.status === 400) {
        toast.error('Server error', {
          position: 'top-right',
        })
      }
    }
  }, [isLoading, isError])

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset()
    }
  }, [isSubmitSuccessful])

  const onSubmitHandler: SubmitHandler<ForgotPasswordInput> = ({ email }) => {
    forgotPassword({ email })
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div
          className="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400"
          role="alert"
        >
          We have sent you a password recovery email.
        </div>
        <a
          className="font-medium text-primary-600 hover:underline dark:text-primary-500"
          href="/"
        >
          Back to login
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
      <Logo />
      <div className="w-full p-6 bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md dark:bg-gray-800 dark:border-gray-700 sm:p-8">
        <h1 className="mb-1 text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
          Forgot your password?
        </h1>
        <p className="font-light text-gray-500 dark:text-gray-400">
          We&apos;ll email you instructions to reset your password.
        </p>
        <FormProvider {...methods}>
          <form
            className="mt-4 space-y-4 lg:mt-5 md:space-y-5"
            onSubmit={handleSubmit(onSubmitHandler)}
          >
            <FormInput
              name="email"
              label="Your email"
              placeholder="name@company.com"
            />
            <div className="flex items-start">
              <div className="text-sm">
                <a
                  className="font-medium text-primary-600 hover:underline dark:text-primary-500"
                  href="/"
                >
                  Back to login
                </a>
              </div>
            </div>
            <Button className="w-full" type="submit">
              Reset password
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}
