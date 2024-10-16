import cx from 'classnames'

import {
  FormattedNumberInput,
  Input,
  SearchableSelect,
  Select,
} from '../../Inputs'
import InvoiceAttachments from '../../Invoices/InvoiceAttachments'
import {
  IInputProps,
  IInputWrapper,
  INumberInputProps,
  ISelectInputProps,
  ISimpleInputProps,
} from '../types'
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
  setFormData,
  type,
}: ISimpleInputProps) => (
  <InputWrapper id={field} label={label}>
    <Input
      id={field}
      className={cx('!ml-0', { 'h-[100px] w-[250px]': type === 'text-area' })}
      onChange={(event) => handleInputChange(event, setFormData, field)}
      {...(type && { ...{ type } })}
    />
  </InputWrapper>
)

export const SearchableSelectInput = ({
  field,
  label,
  options,
  setFormData,
}: ISelectInputProps) => (
  <InputWrapper id={field} label={label}>
    <SearchableSelect
      id={field}
      className={inputsClassName}
      pickerClassName="!left-0"
      onChange={(value) => handleSelectChange(value, setFormData, field)}
      hasClear
    >
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

export const UploadDocumentsInput = ({
  field,
  label,
  setFormData,
}: IInputProps) => (
  <InputWrapper id={field} label={label}>
    <InvoiceAttachments oldFiles={[]} withFileType={false} />
  </InputWrapper>
)
