import useApi from '@ors/hooks/useApi'

export function useGetBpData(filters: any, path: string, identifier: string) {
  const { status, year_end, year_start } = filters

  return useApi({
    options: {
      params: {
        ...(identifier === 'fullData' ? { bp_status: status } : { status }),
        year_end,
        year_start,
      },
      withStoreCache: false,
    },
    path,
  })
}
