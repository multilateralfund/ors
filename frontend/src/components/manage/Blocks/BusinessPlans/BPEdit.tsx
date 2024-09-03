import { RedirectToBpList } from './RedirectToBpList'

export default function BPEdit(props: any) {
  const { agency, period } = props

  return (
    <div className="flex flex-col gap-2">
      <RedirectToBpList currentYearRange={period} />
      <span>{agency}</span>
      <span>{period}</span>
    </div>
  )
}
