export const filtersToQueryParams = (filters: any) => {
  const filtersParams = Object.entries(filters)
    .filter((filter) => !Array.isArray(filter[1]) || filter[1].length > 0)
    .map((filter: any) => {
      const filterVal = filter[1]
      const formattedFilterVal = Array.isArray(filterVal)
        ? filterVal.map((filter) => filter.id).join(',')
        : filterVal

      return (
        encodeURIComponent(filter[0]) +
        '=' +
        encodeURIComponent(formattedFilterVal)
      )
    })

  return filtersParams.join('&')
}
