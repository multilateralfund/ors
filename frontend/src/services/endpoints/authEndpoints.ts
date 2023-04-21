import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions'
import { IUser } from '@/types/User'
import { AuthFormValues } from '@/types/User'

type Output = {
  access_token: string
  refresh_token: string
  user: IUser
}

export const authEndpoints = (
  builder: EndpointBuilder<ReturnType<any>, string, 'api'>,
) => ({
  login: builder.mutation<Output, AuthFormValues>({
    query: body => ({
      url: '/auth/login/',
      method: 'POST',
      body,
    }),
  }),
  forgotPassword: builder.mutation<null, { email: string }>({
    query: body => ({
      url: '/auth/password/reset/',
      method: 'POST',
      body,
    }),
  }),
  resetPassword: builder.mutation<
    null,
    { uid: string; token: string; new_password1: string; new_password2: string }
  >({
    query: body => ({
      url: '/auth/password/reset/confirm/',
      method: 'POST',
      body,
    }),
  }),
})
