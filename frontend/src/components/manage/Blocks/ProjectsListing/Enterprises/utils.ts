import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import { defaultPropsSimpleField, disabledClassName } from '../constants'
import { EnterpriseOverview } from '../interfaces'

import cx from 'classnames'

export const handleChangeSelectValues = (
  field: string,
  setEnterpriseData: Dispatch<SetStateAction<EnterpriseOverview>>,
  value: any,
  isMultiple: boolean,
) => {
  setEnterpriseData((prevData) => ({
    ...prevData,
    [field]: isMultiple
      ? value.map((val: any) => val.id ?? [])
      : (value?.id ?? null),
  }))
}

export const handleChangeTextValues = (
  field: string,
  setEnterpriseData: Dispatch<SetStateAction<EnterpriseOverview>>,
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
) => {
  setEnterpriseData((prevData) => ({
    ...prevData,
    [field]: event.target.value,
  }))
}

export const handleChangeNumericValues = (
  field: string,
  setEnterpriseData: Dispatch<SetStateAction<EnterpriseOverview>>,
  event: ChangeEvent<HTMLInputElement>,
) => {
  const initialValue = event.target.value
  const value = initialValue === '' ? null : initialValue

  if (!isNaN(Number(value))) {
    setEnterpriseData((prevData) => ({
      ...prevData,
      [field]: value,
    }))
  } else {
    event.preventDefault()
  }
}

export const getIsInputInvalid = (hasSubmitted: boolean, errors: any) =>
  hasSubmitted && errors?.length > 0

export const getFieldDefaultProps = (
  hasSubmitted: boolean,
  errors: any[],
  isFieldDisabled: boolean = false,
) => {
  return {
    ...{
      ...defaultPropsSimpleField,
      className: cx(
        defaultPropsSimpleField.className,
        '!m-0 h-10 !py-1',
        {
          'border-red-500': getIsInputInvalid(hasSubmitted, errors),
        },
        { [disabledClassName]: isFieldDisabled },
      ),
    },
  }
}
