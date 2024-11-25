import { useStore } from '@ors/store'

const DiffTooltipHeader = (props: any) => {
  const { new_value, old_value } = props
  const { report } = useStore((state) => state.cp_reports)
  const currentVersion = report.data?.version

  return (
    <div className="flex flex-col gap-1">
      <span>
        {currentVersion && `Version ${currentVersion} - `}
        {new_value}
      </span>
      <span>
        {currentVersion && `Version ${currentVersion - 1} - `}
        {old_value}
      </span>
    </div>
  )
}

export default DiffTooltipHeader
