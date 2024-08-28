export const filtersToQueryParams = (filters: any) => {
  const filtersParams = Object.entries(filters).map(
    (filter: any) =>
      encodeURIComponent(filter[0]) + '=' + encodeURIComponent(filter[1]),
  )

  return filtersParams.join('&')
}
