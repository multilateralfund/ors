import { FC, InputHTMLAttributes } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { twMerge } from 'tailwind-merge'
import { InputError } from './InputError'

type ButtonSize = 'xs' | 'sm' | 'lg'

interface IFormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string
  label: string
  sizing?: ButtonSize
}

export const FormInput: FC<IFormInputProps> = ({
  name,
  label,
  sizing = 'xs',
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
    w-full
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
      render={({ field }) => (
        <>
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </label>
          <input className={inputClasses} {...field} {...otherProps} />
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
