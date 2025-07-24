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

  const defaultDecimals = {
    maximumFractionDigits: 10,
    minimumFractionDigits: 0,
  }

  const formattedValue =
    props.context?.unit === 'gwp' || props.isCo2
      ? formatDecimalValue(valueToFormat, {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0,
        })
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
                ODP tonnes:{' '}
                {formatDecimalValue(valueODP, {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
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
                CO<sub>2</sub>-eq tonnes:{' '}
                {formatDecimalValue(valueGWP, {
                  maximumFractionDigits: 0,
                  minimumFractionDigits: 0,
                })}
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
                CO<sub>2</sub>-eq tonnes:{' '}
                {formatDecimalValue(valueGWP, defaultDecimals)}
              </span>
              <span>
                ODP tonnes: {formatDecimalValue(valueODP, defaultDecimals)}
              </span>
            </div>
          ) : (
            <span>
              {formatDecimalValue(
                value,
                props.isCo2
                  ? {
                      maximumFractionDigits: 0,
                      minimumFractionDigits: 0,
                    }
                  : defaultDecimals,
              )}
            </span>
          )
    }
  }

  return {
    TitleContent,
    formattedValue,
  }
}

export { getDecimalCellValue }
