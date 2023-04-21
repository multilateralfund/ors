import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from 'flowbite-react'
import { api, useLoginMutation } from '@/services/api'
import { setToken } from '@/slices/authSlice'
import { setUser } from '@/slices/userSlice'
import { InputError } from '@/components/shared/InputError'
import { AuthFormValues, authSchema } from '@/types/User'

export const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
  })
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [login, { isLoading, error }] = useLoginMutation()

  const onSubmit = async ({ username, password }: AuthFormValues) => {
    if (isLoading) {
      return
    }

    const loginOutput = await login({ username, password }).unwrap()

    dispatch(setToken(loginOutput))
    dispatch(setUser(loginOutput.user))
    dispatch(api.util.resetApiState())

    navigate('/profile')
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
      <a href="#" className="items-center block w-60 mb-5">
        <img
          className="w-auto h-auto"
          src="http://www.multilateralfund.org/_layouts/images/UNMFNewLogo.bmp"
          alt="logo"
        />
      </a>
      <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
            Sign in to your account
          </h1>
          <form
            className="space-y-4 md:space-y-6"
            onSubmit={handleSubmit(d => onSubmit(d))}
          >
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Username
              </label>
              <input
                {...register('username', {
                  required: 'Email Address is required',
                })}
                // type="email"
                name="username"
                id="username"
                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="name@company.com"
              />
              {errors.username?.message && (
                <InputError>{errors.username.message}</InputError>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Password
              </label>
              <input
                {...register('password', { required: true })}
                type="password"
                name="password"
                id="password"
                placeholder="••••••••"
                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
              {errors.password && (
                <InputError>{errors.password.message}</InputError>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="remember"
                    aria-describedby="remember"
                    type="checkbox"
                    className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="remember"
                    className="text-gray-500 dark:text-gray-300"
                  >
                    Remember me
                  </label>
                </div>
              </div>
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
        </div>
      </div>
    </div>
  )
}
