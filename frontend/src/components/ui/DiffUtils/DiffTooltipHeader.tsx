const DiffTooltipHeader = (props: any) => {
  const { new_value, old_value } = props
  return (
    <div className="flex flex-col gap-1">
      <span>{new_value}</span>
      <span>{old_value}</span>
    </div>
  )
}

export default DiffTooltipHeader
