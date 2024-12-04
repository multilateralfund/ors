export const filtersToQueryParams = (filters: any) => {
  const filtersParams = Object.entries(filters).map(
    (filter: any) =>
      encodeURIComponent(filter[0]) + '=' + encodeURIComponent(filter[1]),
  )

  return filtersParams.join('&')
}

export const getAgencyByName = (commonSlice: any, agency: string) =>
  commonSlice.agencies.data.find((item: any) => item.name === agency)
