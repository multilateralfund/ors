export default function BPEdit(props: any) {
  const { agency, period} = props

  return (
    <div className="flex flex-col gap-2">
      <span>{agency}</span>
      <span>{period}</span>
    </div>
  )
}
