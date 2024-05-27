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

  const formattedValue =
    props.context?.unit === 'gwp'
      ? parseInt(`${valueToFormat}`, 10).toLocaleString()
      : formatDecimalValue(valueToFormat, props)

  let TitleContent = null

  switch (props.context?.section?.id) {
    case 'section_a':
      TitleContent =
        valueODP != null ? (
          <div className="flex flex-col gap-1">
            <span>Metric tonnes: {value}</span>
            <span>ODP tonnes: {valueODP}</span>
          </div>
        ) : (
          <span>{value}</span>
        )
      break
    case 'section_b':
      TitleContent =
        valueGWP != null ? (
          <div className="flex flex-col gap-1">
            <span>Metric tonnes: {value}</span>
            <span>
              CO<sup>2</sup> equivalent: {valueGWP}
            </span>
          </div>
        ) : (
          <span>{value}</span>
        )
      break
    default:
      TitleContent =
        valueGWP != null && valueODP != null ? (
          <div className="flex flex-col gap-1">
            <span>Metric tonnes: {value}</span>
            <span>
              CO<sup>2</sup> equivalent: {valueGWP}
            </span>
            <span>ODP tonnes: {valueODP}</span>
          </div>
        ) : (
          <span>{value}</span>
        )
  }

  return {
    TitleContent,
    formattedValue,
  }
}

export { getDecimalCellValue }
