import { fixFloat, formatDecimalValue } from '@ors/helpers/Utils/Utils'

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

  const defaultDecimals = {
    maximumFractionDigits: 10,
    minimumFractionDigits: 0,
  }

  const formattedValue =
    props.context?.unit === 'gwp'
      ? parseInt(`${valueToFormat}`, 10).toLocaleString()
      : formatDecimalValue(valueToFormat, props)

  let TitleContent = null

  if (value === 0) {
    TitleContent = <span>0</span>
  } else {
    switch (props.context?.section?.id) {
      case 'section_a':
        TitleContent =
          valueODP != null ? (
            <div className="flex flex-col gap-1">
              <span>
                Metric tonnes: {formatDecimalValue(value, defaultDecimals)}
              </span>
              <span>
                ODP tonnes: {formatDecimalValue(valueODP, defaultDecimals)}
              </span>
            </div>
          ) : (
            <span>{formatDecimalValue(value, defaultDecimals)}</span>
          )
        break
      case 'section_b':
        TitleContent =
          valueGWP != null ? (
            <div className="flex flex-col gap-1">
              <span>
                Metric tonnes: {formatDecimalValue(value, defaultDecimals)}
              </span>
              <span>
                CO<sup>2</sup>-eq tonnes:{' '}
                {formatDecimalValue(valueGWP, defaultDecimals)}
              </span>
            </div>
          ) : (
            <span>{formatDecimalValue(value, defaultDecimals)}</span>
          )
        break
      case 'section_c':
        TitleContent = (
          <span>
            {value % 1 == 0
              ? `${value}.00`
              : formatDecimalValue(value, defaultDecimals)}
          </span>
        )
        break
      default:
        TitleContent =
          valueGWP != null && valueODP != null ? (
            <div className="flex flex-col gap-1">
              <span>
                Metric tonnes: {formatDecimalValue(value, defaultDecimals)}
              </span>
              <span>
                CO<sup>2</sup>-eq tonnes:{' '}
                {formatDecimalValue(valueGWP, defaultDecimals)}
              </span>
              <span>
                ODP tonnes: {formatDecimalValue(valueODP, defaultDecimals)}
              </span>
            </div>
          ) : (
            <span>{formatDecimalValue(value, defaultDecimals)}</span>
          )
    }
  }

  return {
    TitleContent,
    formattedValue,
  }
}

export { getDecimalCellValue }
