import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import { EnterpriseOverview, EnterpriseSubstanceDetails } from '../interfaces'
import { defaultPropsSimpleField, disabledClassName } from '../constants'

import { find, get, isNil, isObject, keys, sumBy } from 'lodash'
import cx from 'classnames'

export const handleChangeSelectValues = <T>(
  field: string,
  setEnterpriseData: Dispatch<SetStateAction<T>>,
  value: any,
  sectionIdentifier?: keyof T | null,
) => {
  const formattedValue = value?.id ?? null

  setEnterpriseData((prev) => ({
    ...prev,
    ...(sectionIdentifier
      ? {
          [sectionIdentifier]: {
            ...prev[sectionIdentifier],
            [field]: formattedValue,
          },
        }
      : {
          [field]: formattedValue,
        }),
  }))
}

export const handleChangeTextValues = <T>(
  field: string,
  setEnterpriseData: Dispatch<SetStateAction<T>>,
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  sectionIdentifier?: keyof T | null,
) => {
  setEnterpriseData((prev) => ({
    ...prev,
    ...(sectionIdentifier
      ? {
          [sectionIdentifier]: {
            ...prev[sectionIdentifier],
            [field]: event.target.value,
          },
        }
      : { [field]: event.target.value }),
  }))
}

export const handleChangeIntegerValues = <T>(
  field: string,
  setEnterpriseData: Dispatch<SetStateAction<T>>,
  event: ChangeEvent<HTMLInputElement>,
  sectionIdentifier?: keyof T | null,
) => {
  const value = event.target.value

  if (value === '' || !isNaN(parseInt(value))) {
    const finalVal = value ? parseInt(value) : null

    setEnterpriseData((prev) => ({
      ...prev,
      ...(sectionIdentifier
        ? {
            [sectionIdentifier]: {
              ...prev[sectionIdentifier],
              [field]: finalVal,
            },
          }
        : { [field]: finalVal }),
    }))
  } else {
    event.preventDefault()
  }
}

export const handleChangeDecimalValues = <T>(
  field: string,
  setEnterpriseData: Dispatch<SetStateAction<T>>,
  event: ChangeEvent<HTMLInputElement>,
  sectionIdentifier?: keyof T | null,
) => {
  const initialValue = event.target.value
  const value = initialValue === '' ? null : initialValue

  if (!isNaN(Number(value))) {
    setEnterpriseData((prev) => ({
      ...prev,
      ...(sectionIdentifier
        ? {
            [sectionIdentifier]: {
              ...prev[sectionIdentifier],
              [field]: value,
            },
          }
        : { [field]: value }),
    }))
  } else {
    event.preventDefault()
  }
}

export const handleChangeDateValues = <T>(
  field: string,
  setEnterpriseData: Dispatch<SetStateAction<T>>,
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  sectionIdentifier?: keyof T | null,
) => {
  const formattedVal = event.target.value || null

  setEnterpriseData((prev) => ({
    ...prev,
    ...(sectionIdentifier
      ? {
          [sectionIdentifier]: {
            ...prev[sectionIdentifier],
            [field]: formattedVal,
          },
        }
      : { [field]: formattedVal }),
  }))
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

export const getFieldErrors = (
  data: any,
  errors: { [key: string]: string[] },
  isOnlyEditValidation: boolean = false,
) => {
  const requiredFields = isOnlyEditValidation ? ['id', 'name'] : ['name']

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

export const getOptionLabel = (
  data: any,
  option: any,
  displayedField: string = 'name',
  identifierField: string = 'id',
) =>
  isObject(option)
    ? get(option, [displayedField])
    : find(data, { [identifierField]: option })?.[displayedField] || ''

export const getEntityById = (data: any, id: number | null) =>
  find(data, (entry) => entry.id === id)

export const getFundsApproved = (
  capital_cost_approved: string | null,
  operating_cost_approved: string | null,
) =>
  isNil(capital_cost_approved) && isNil(operating_cost_approved)
    ? null
    : Number(capital_cost_approved ?? 0) + Number(operating_cost_approved ?? 0)

export const getCostEffectivenessApproved = (
  ods_odp: EnterpriseSubstanceDetails[],
  capital_cost_approved: string | null,
  operating_cost_approved: string | null,
) => {
  const funds_approved = getFundsApproved(
    capital_cost_approved,
    operating_cost_approved,
  )
  const totalPhaseOut = sumBy(
    ods_odp,
    ({ consumption }) => Number(consumption) || 0,
  )
  const cost_effectiveness_approved =
    !isNil(funds_approved) && totalPhaseOut
      ? (funds_approved ?? 0) / (totalPhaseOut * 1000)
      : null

  return cost_effectiveness_approved && !isNaN(cost_effectiveness_approved)
    ? cost_effectiveness_approved
    : null
}
