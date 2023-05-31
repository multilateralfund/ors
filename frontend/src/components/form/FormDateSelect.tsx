import { FC } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import DatePicker, { ReactDatePickerProps } from 'react-datepicker'
import { twMerge } from 'tailwind-merge'
import { InputError } from './InputError'
import { FormTooltip } from './FormTooltip'

type ButtonSize = 'xs' | 'sm' | 'lg'

interface FormDateSelectProps extends Partial<ReactDatePickerProps> {
  name: string
  label: string
  sizing?: ButtonSize
  tooltip?: string
  inline?: boolean
}

export const FormDateSelect: FC<FormDateSelectProps> = ({
  name,
  label,
  sizing = 'xs',
  inline = false,
  tooltip,
  ...otherProps
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext()

  const sizes: Record<ButtonSize, number> = {
    xs: 1.5,
    sm: 2.5,
    lg: 3,
  }

  const inputClasses = twMerge(`
    bg-gray-50
    border
    border-gray-300
    text-gray-900
    sm:text-sm
    rounded-lg
    focus:ring-primary-600
    focus:border-primary-600
    block
    ${inline ? 'w-full' : 'w-full'}
    p-${sizes[sizing]}
    dark:bg-gray-700
    dark:border-gray-600
    dark:placeholder-gray-400
    dark:text-white
    dark:focus:ring-blue-500
    dark:focus:border-blue-500
  `)

  return (
    <Controller
      control={control}
      defaultValue=""
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <>
          {inline ? (
            <div className="flex flex-row w-full justify-between items-center">
              <div className="flex items-center mb-2 text-sm font-medium text-gray-900 dark:text-white w-1/2 ">
                <span className="mr-1">{label}</span>{' '}
                {tooltip && <FormTooltip content={tooltip} />}
              </div>
              <DatePicker
                {...otherProps}
                selected={value}
                onChange={onChange}
                onBlur={onBlur}
                className={inputClasses}
                dateFormat="yyyy/MM/dd"
                showTimeInput
              />
            </div>
          ) : (
            <>
              <div className="flex items-center mb-2 text-sm font-medium text-gray-900 dark:text-white">
                <span className="mr-1">{label}</span>{' '}
                {tooltip && <FormTooltip content={tooltip} />}
              </div>
              <DatePicker
                {...otherProps}
                selected={value}
                onChange={onChange}
                onBlur={onBlur}
                className={inputClasses}
                dateFormat="yyyy/MM/dd"
              />
            </>
          )}

          {!!errors[name] && (
            <InputError>
              {errors[name] ? (errors[name]?.message as unknown as string) : ''}
            </InputError>
          )}
        </>
      )}
    />
  )
}
