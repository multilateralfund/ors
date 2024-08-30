export const filtersToQueryParams = (filters: any) => {
  const filtersParams = Object.entries(filters).map(
    (filter: any) =>
      encodeURIComponent(filter[0]) + '=' + encodeURIComponent(filter[1]),
  )

  return filtersParams.join('&')
}

export const getTagClassName = (status: string) => {
  switch (status) {
    case 'Agency Draft':
      return 'bg-[green] text-white'
    case 'Approved':
      return 'bg-mlfs-hlYellow'
    case 'Need Changes':
      return 'bg-[red] text-white'
    case 'Rejected':
      return 'bg-warning text-white'
    case 'Secretariat Draft':
      return 'bg-[blue] text-white'
    case 'Submitted':
      return 'bg-primary text-mlfs-hlYellow'
    default:
      return ''
  }
}
