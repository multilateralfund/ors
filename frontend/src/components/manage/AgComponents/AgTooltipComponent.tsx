import { Tooltip } from '@mui/material'

export default function AgTooltipComponent(props: any) {
  const { children, placement = 'top-start', value } = props
  if (!props.colDef.tooltip) return children
  return (
    <Tooltip enterDelay={300} placement={placement} title={value}>
      {children}
    </Tooltip>
  )
}
