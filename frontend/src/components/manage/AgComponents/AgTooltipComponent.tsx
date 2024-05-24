import { Tooltip, Typography } from '@mui/material'

const RemarksText = (props: any) => {
  const { children } = props
  return (
    <Typography component="h1" variant="subtitle1">
      {children}
    </Typography>
  )
}

export default function AgTooltipComponent(props: any) {
  const {
    children,
    placement = 'top-start',
    remarks,
    tooltipValue,
    value,
  } = props
  if (tooltipValue || props.colDef.tooltip || props.data?.tooltip) {
    const title = tooltipValue || value
    return (
      <Tooltip
        enterDelay={300}
        placement={placement}
        title={remarks ? <RemarksText>{title}</RemarksText> : title}
      >
        {children}
      </Tooltip>
    )
  }
  return children
}
