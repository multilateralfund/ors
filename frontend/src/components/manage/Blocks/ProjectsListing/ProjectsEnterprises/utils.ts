import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import { defaultPropsSimpleField, disabledClassName } from '../constants'
import { EnterpriseData, EnterpriseOverview } from '../interfaces'

import { keys } from 'lodash'
import cx from 'classnames'

export const handleChangeTextValues = (
  sectionIdentifier: keyof EnterpriseData,
  field: string,
  setEnterpriseData: Dispatch<SetStateAction<EnterpriseData>>,
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
) => {
  setEnterpriseData((prevData) => ({
    ...prevData,
    [sectionIdentifier]: {
      ...prevData[sectionIdentifier],
      [field]: event.target.value,
    },
  }))
}

export const handleChangeNumericValues = (
  sectionIdentifier: keyof EnterpriseData,
  field: string,
  setEnterpriseData: Dispatch<SetStateAction<EnterpriseData>>,
  event: ChangeEvent<HTMLInputElement>,
) => {
  const initialValue = event.target.value
  const value = initialValue === '' ? null : initialValue

  if (!isNaN(Number(value))) {
    setEnterpriseData((prevData) => ({
      ...prevData,
      [sectionIdentifier]: {
        ...prevData[sectionIdentifier],
        [field]: value,
      },
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

export const getEnterprisesErrors = (
  data: any,
  errors: { [key: string]: string[] },
) => {
  const requiredFields = ['name']

  const fields = keys(data)
  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => fields.includes(key)),
  )

  return {
    ...requiredFields
      .filter((field) => fields.includes(field))
      .reduce((acc: any, field) => {
        acc[field] = !data[field as keyof EnterpriseOverview]
          ? ['This field is required.']
          : []

        return acc
      }, {}),
    ...filteredErrors,
  }
}
