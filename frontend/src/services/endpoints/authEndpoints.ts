import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions'
import { IUser } from '@/types/User'
import { LoginInput } from '@/pages/auth/LoginPage'
import { setToken } from '@/slices/authSlice'
import { setUser } from '@/slices/userSlice'

type Output = {
  access_token: string
  refresh_token: string
  user: IUser
}

export const authEndpoints = (
  builder: EndpointBuilder<ReturnType<any>, string, 'api'>,
) => ({
  login: builder.mutation<Output, LoginInput>({
    query: body => ({
      url: '/auth/login/',
      method: 'POST',
      body,
    }),
    async onQueryStarted(_, { dispatch, queryFulfilled }) {
      try {
        const { data } = await queryFulfilled
        dispatch(setToken(data))
        dispatch(setUser(data.user))
      } catch (error) {}
    },
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
