import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions'
import { BaseOutput } from '../../types/BaseOutput'

export const authEndpoints = (
  builder: EndpointBuilder<ReturnType<any>, string, 'api'>,
) => ({
  login: builder.mutation<BaseOutput<string>, any>({
    query: body => ({
      url: '/auth/login',
      method: 'POST',
      body,
    }),
  }),
})
