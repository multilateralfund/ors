import { FormattedNumberInput, Input, Select } from '../../Inputs'
import {
  IInputProps,
  IInputWrapper,
  INumberInputProps,
  ISelectInputProps,
} from '../types'
import {
  handleClearSelect,
  handleInputChange,
  handleNumberInputChange,
} from './editHelpers'

const inputsClassName =
  'placeholder-select !ml-0 focus-visible:outline-none focus-visible:ring-0'

const InputWrapper = (props: IInputWrapper) => {
  const { id, children, label } = props

  return (
    <div className="flex w-72 flex-col">
      <label htmlFor={`${id}_mask`}>
        <div className="flex flex-col text-primary">
          <span className="font-medium">{label}</span>
        </div>
      </label>
      <div className="w-3/5">{children}</div>
    </div>
  )
}

export const SelectInput = ({
  field,
  label,
  options,
  placeholder,
  setFormData,
  value,
}: ISelectInputProps) => (
  <InputWrapper id={field} label={label}>
    <Select
      id={field}
      className={inputsClassName}
      {...(value && { ...{ value } })}
      disabled={!!value}
      hasClear={!value}
      onChange={(event) => handleInputChange(event, setFormData, field)}
      onClear={() => handleClearSelect(setFormData, field)}
    >
      <option value="" disabled hidden>
        {placeholder}
      </option>
      {options.map(({ label, value }) => (
        <option key={value} className="text-primary" value={value}>
          {label}
        </option>
      ))}
    </Select>
  </InputWrapper>
)

export const NumberInput = ({
  field,
  label,
  setFormData,
}: INumberInputProps) => (
  <InputWrapper id={field} label={label}>
    <FormattedNumberInput
      id={field}
      className="!ml-0"
      step="0.01"
      onChange={(event) => handleNumberInputChange(event, setFormData, field)}
      onlyNumber
    />
  </InputWrapper>
)

export const TextareaInput = ({ field, label, setFormData }: IInputProps) => (
  <InputWrapper id={field} label={label}>
    <Input
      id={field}
      className="!ml-0"
      type="text-area"
      onChange={(event) => handleInputChange(event, setFormData, field)}
    />
  </InputWrapper>
)
