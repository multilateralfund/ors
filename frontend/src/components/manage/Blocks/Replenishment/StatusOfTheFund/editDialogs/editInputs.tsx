import cx from 'classnames'
import { noop } from 'lodash'

import {
  FormattedNumberInput,
  Input,
  SearchableSelect,
  Select,
} from '../../Inputs'
import {
  IInputWrapper,
  INumberInputProps,
  ISelectInputProps,
  ISimpleInputProps,
} from '../types'
import PopoverInput from './PopoverInput'
import {
  handleClearSelect,
  handleInputChange,
  handleNumberInputChange,
  handleSelectChange,
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

export const SimpleInput = ({
  field,
  label,
  setFormData = noop,
  type,
  ...rest
}: ISimpleInputProps) => (
  <InputWrapper id={field} label={label}>
    <Input
      id={field}
      className={cx('!ml-0', { 'h-[100px] w-[250px]': type === 'text-area' })}
      onChange={(event) => handleInputChange(event, setFormData, field)}
      {...(type && { ...{ type } })}
      {...rest}
    />
  </InputWrapper>
)

export const SearchableSelectInput = ({
  field,
  label,
  options,
  setFormData = noop,
}: ISelectInputProps) => (
  <InputWrapper id={field} label={label}>
    <SearchableSelect
      id={field}
      className={inputsClassName}
      hideFirstOption={true}
      pickerClassName="!left-0"
      onChange={(value) => handleSelectChange(value, setFormData, field)}
      hasClear
    >
      <option value="" disabled hidden />
      {options.map(({ label, value }) => (
        <option key={value} className="text-primary" value={value}>
          {label}
        </option>
      ))}
    </SearchableSelect>
  </InputWrapper>
)

export const SelectInput = ({
  field,
  label,
  options,
  placeholder,
  setFormData = noop,
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
  setFormData = noop,
  ...rest
}: INumberInputProps) => (
  <InputWrapper id={field} label={label}>
    <FormattedNumberInput
      id={field}
      className="!ml-0"
      onChange={(event) => handleNumberInputChange(event, setFormData, field)}
      {...rest}
    />
  </InputWrapper>
)

export const PopoverInputField = ({
  field,
  label,
  setFormData = noop,
  ...rest
}: ISelectInputProps) => (
  <InputWrapper id={field} label={label}>
    <PopoverInput
      className="!ml-0"
      field={field}
      withClear={true}
      onChange={(value) => handleSelectChange(value, setFormData, field)}
      onClear={() => handleClearSelect(setFormData, field)}
      {...rest}
    />
  </InputWrapper>
)
