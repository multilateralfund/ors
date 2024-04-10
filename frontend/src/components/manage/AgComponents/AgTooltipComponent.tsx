import { Tooltip } from '@mui/material'

export default function AgTooltipComponent(props: any) {
  const { children, placement = 'top-start', tooltipValue, value } = props
  if (tooltipValue || props.colDef.tooltip || props.data?.tooltip) {
    return (
      <Tooltip enterDelay={300} placement={placement} title={tooltipValue || value}>
        {children}
      </Tooltip>
    )
  }
  return children
}
