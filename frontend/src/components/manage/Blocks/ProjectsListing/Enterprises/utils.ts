import { ChangeEvent } from 'react'

import { defaultPropsSimpleField, disabledClassName } from '../constants'
import { OptionsType } from '../interfaces'
import {
  EnterpriseData,
  SetEnterpriseData,
  EnterpriseSubstanceDetails,
} from './interfaces'

import { find, isNaN, isNil, keys, sumBy } from 'lodash'
import cx from 'classnames'

export const getIsAgencyUser = (
  canViewOnlyOwnAgency: boolean,
  agency_id: number | undefined,
) => canViewOnlyOwnAgency && !!agency_id

export const getEntityNameById = (data: any, id: number | null) =>
  find(data, (entry) => entry.id === id)?.name

export const getFormattedDecimalValue = (value: string | null) => {
  const numberValue = Number(value)

  if (isNaN(numberValue)) {
    return null
  }

  return !isNil(value) ? numberValue.toFixed(10).toString() : value
}

export const getFundsApproved = (
  capital_cost_approved: string | null,
  operating_cost_approved: string | null,
) =>
  isNil(capital_cost_approved) && isNil(operating_cost_approved)
    ? null
    : Number(
        (
          Number(capital_cost_approved ?? 0) +
          Number(operating_cost_approved ?? 0)
        ).toFixed(10),
      )

export const getCostEffectivenessApproved = (
  ods_odp: EnterpriseSubstanceDetails[],
  funds_approved: string | null,
) => {
  const totalPhaseOut = sumBy(
    ods_odp,
    ({ consumption }) => Number(consumption) || 0,
  )
  const cost_effectiveness_approved =
    !isNil(funds_approved) && totalPhaseOut
      ? (Number(funds_approved) ?? 0) / (totalPhaseOut * 1000)
      : null

  return cost_effectiveness_approved && !isNaN(cost_effectiveness_approved)
    ? cost_effectiveness_approved.toFixed(10)
    : null
}

export const getFieldDefaultProps = (isFieldDisabled: boolean = false) => ({
  ...defaultPropsSimpleField,
  className: cx(defaultPropsSimpleField.className, '!m-0 h-10 !py-1', {
    [disabledClassName]: isFieldDisabled,
  }),
})

export const handleChangeTextValues = (
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  sectionIdentifier: keyof EnterpriseData,
  field: string,
  setEnterpriseData: SetEnterpriseData,
) => {
  setEnterpriseData(
    (prev) => ({
      ...prev,
      [sectionIdentifier]: {
        ...prev[sectionIdentifier],
        [field]: event.target.value,
      },
    }),
    field,
  )
}

export const handleChangeIntegerValues = (
  event: ChangeEvent<HTMLInputElement>,
  sectionIdentifier: keyof EnterpriseData,
  field: string,
  setEnterpriseData: SetEnterpriseData,
) => {
  const value = event.target.value

  if (value === '' || !isNaN(parseInt(value))) {
    const finalVal = value ? parseInt(value) : null

    setEnterpriseData(
      (prev) => ({
        ...prev,
        [sectionIdentifier]: {
          ...prev[sectionIdentifier],
          [field]: finalVal,
        },
      }),
      field,
    )
  } else {
    event.preventDefault()
  }
}

export const handleChangeDecimalValues = (
  event: ChangeEvent<HTMLInputElement>,
  sectionIdentifier: keyof EnterpriseData,
  field: string,
  setEnterpriseData: SetEnterpriseData,
) => {
  const initialValue = event.target.value
  const value = initialValue === '' ? null : initialValue

  if (!isNaN(Number(value))) {
    const splitValue = value?.split('.')
    const decimalPart = splitValue?.[1]

    if (decimalPart && decimalPart.length > 10) {
      return
    }

    setEnterpriseData(
      (prev) => ({
        ...prev,
        [sectionIdentifier]: {
          ...prev[sectionIdentifier],
          [field]: value,
        },
      }),
      field,
    )
  } else {
    event.preventDefault()
  }
}

export const handleChangeSelectValues = (
  value: OptionsType,
  sectionIdentifier: keyof EnterpriseData,
  field: string,
  setEnterpriseData: SetEnterpriseData,
) => {
  const formattedValue = value?.id ?? null

  setEnterpriseData(
    (prev) => ({
      ...prev,
      [sectionIdentifier]: {
        ...prev[sectionIdentifier],
        [field]: formattedValue,
      },
    }),
    field,
  )
}

export const handleChangeDateValues = (
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  sectionIdentifier: keyof EnterpriseData,
  field: string,
  setEnterpriseData: SetEnterpriseData,
) => {
  const formattedVal = event.target.value || null

  setEnterpriseData(
    (prev) => ({
      ...prev,
      [sectionIdentifier]: {
        ...prev[sectionIdentifier],
        [field]: formattedVal,
      },
    }),
    field,
  )
}

export const getFieldErrors = (
  data: Record<string, any>,
  errors: { [key: string]: string[] },
) => {
  const fields = keys(data)
  const requiredFields = ['name', 'country']

  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => fields.includes(key)),
  )

  return {
    ...requiredFields
      .filter((field) => fields.includes(field))
      .reduce((acc: Record<string, string[]>, field) => {
        acc[field] = !data[field] ? ['This field is required.'] : []

        return acc
      }, {}),
    ...filteredErrors,
  }
}
