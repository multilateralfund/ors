import { useEffect } from 'react'
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { object, string, TypeOf } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-toastify'
import { useResetPasswordMutation } from '@/services/api'
import { FormInput } from '@/components/form/FormInput'
import { Button } from '@/components/shared/Button'
import { Logo } from '@/components/shared/Logo'

const resetPasswordSchema = object({
  new_password1: string()
    .min(1, 'Password is required')
    .min(8, 'Password must be more than 8 characters'),
  new_password2: string().min(1, 'Please confirm your password'),
}).refine(data => data.new_password1 === data.new_password2, {
  message: 'Passwords do not match',
  path: ['passwordConfirm'],
})

export type ResetPasswordInput = TypeOf<typeof resetPasswordSchema>

export const ResetPasswordPage = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>()

  const methods = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const [resetPassword, { isLoading, isError, error, isSuccess, data }] =
    useResetPasswordMutation()

  const navigate = useNavigate()

  const {
    reset,
    handleSubmit,
    formState: { isSubmitSuccessful },
  } = methods

  useEffect(() => {
    if (isSuccess) {
      navigate('/')
      toast.success('Password updated successfully, login')
    }

    if (isError) {
      if (error.status === 400) {
        toast.error('Server error', {
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

  const onSubmitHandler: SubmitHandler<ResetPasswordInput> = values => {
    resetPassword({ ...values, token: token!, uid: uid! })
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
      <Logo />
      <div className="w-full p-6 bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md dark:bg-gray-800 dark:border-gray-700 sm:p-8">
        <h1 className="mb-1 text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
          Change Password
        </h1>
        <FormProvider {...methods}>
          <form
            className="mt-4 space-y-4 lg:mt-5 md:space-y-5"
            onSubmit={handleSubmit(onSubmitHandler)}
          >
            <FormInput
              name="new_password1"
              label="New Password"
              placeholder="••••••••"
              type="password"
            />
            <FormInput
              name="new_password2"
              label="Confirm password"
              placeholder="••••••••"
              type="password"
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
            <Button type="submit" isLoading={isLoading}>
              Change password
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}
