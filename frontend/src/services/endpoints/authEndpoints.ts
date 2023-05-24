import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions'
import { IUser } from '@/types/User'
import { LoginInput } from '@/pages/auth/LoginPage'
import { logout } from '@/slices/authSlice'
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
      credentials: 'include',
      body,
    }),
    async onQueryStarted(_, { dispatch, queryFulfilled }) {
      try {
        const { data } = await queryFulfilled
        dispatch(setUser(data.user))
      } catch (error) {}
    },
  }),
  logout: builder.mutation<void, void>({
    query: _ => ({
      url: '/auth/logout/',
      method: 'POST',
      // credentials: 'include',
    }),
    async onQueryStarted(_, { dispatch, queryFulfilled }) {
      try {
        await queryFulfilled
        dispatch(logout())
      } catch (error) {}
    },
  }),
  forgotPassword: builder.mutation<null, { email: string }>({
    query: body => ({
      url: '/auth/password/reset/',
      method: 'POST',
      credentials: 'include',
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
      credentials: 'include',
      body,
    }),
  }),
})
