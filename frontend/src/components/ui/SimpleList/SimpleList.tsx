function SimpleList(props: any) {
  const { list } = props
  console.log(list)

  // Mock user and random date
  const mockUser = 'John Smith'
  const randomDate = 'June 15, 2024 12:53'

  return (
    list && (
      <ul className="flex flex-col gap-4">
        {list.map((item: any) => {
          return (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between border-0 border-b border-solid border-secondary pb-4"
            >
              <span className="text-2xl font-semibold text-typography">
                {item.agency.name} {item.year_start} - {item.year_end}
              </span>
              <span className="font-normal tracking-tight">
                Modified on {randomDate} by {mockUser}
              </span>
            </li>
          )
        })}
      </ul>
    )
  )
}

export default SimpleList
