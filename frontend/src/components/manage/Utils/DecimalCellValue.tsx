import { formatDecimalValue } from '@ors/helpers/Utils/Utils'

function getDecimalCellValue(
  value: number,
  valueODP: null | number,
  valueGWP: null | number,
  props: any,
) {
  let valueToFormat

  switch (props.context?.unit) {
    case 'gwp':
      valueToFormat = valueGWP ?? value
      break
    case 'odp':
      valueToFormat = valueODP ?? value
      break
    default:
      valueToFormat = value
  }

  const formattedValue = formatDecimalValue(valueToFormat, props)

  const TitleContent =
    valueGWP != null && valueODP != null ? (
      <div className="flex flex-col gap-1">
        <span>Metric tonnes: {value}</span>
        <span>GWP: {valueGWP}</span>
        <span>ODP tonnes: {valueODP}</span>
      </div>
    ) : (
      <span>{value}</span>
    )

  return {
    TitleContent,
    formattedValue,
  }
}

export { getDecimalCellValue }
