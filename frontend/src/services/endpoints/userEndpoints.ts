import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions'
import { BaseOutput } from '../../types/BaseOutput'

export const userEndpoints = (
  builder: EndpointBuilder<ReturnType<any>, string, 'api'>,
) => ({
  getMe: builder.query<BaseOutput<any>, null>({
    query: () => ({
      url: '/user/me',
      method: 'GET',
    }),
  }),
})
