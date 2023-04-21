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
})
