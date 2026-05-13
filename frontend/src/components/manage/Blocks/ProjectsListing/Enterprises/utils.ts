import { ChangeEvent } from 'react'

import { defaultPropsSimpleField, disabledClassName } from '../constants'
import {
  EnterpriseData,
  EnterpriseOverview,
  EnterpriseSubstanceDetails,
  SetEnterpriseData,
} from './interfaces'

import { find, isNil, keys, sumBy } from 'lodash'
import cx from 'classnames'

export const handleChangeSelectValues = (
  field: string,
  setEnterpriseData: SetEnterpriseData,
  value: any,
  sectionIdentifier?: keyof EnterpriseData | null,
) => {
  const formattedValue = value?.id ?? null

  setEnterpriseData(
    (prev) => ({
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
    }),
    field,
  )
}

export const handleChangeTextValues = (
  field: string,
  setEnterpriseData: SetEnterpriseData,
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  sectionIdentifier?: keyof EnterpriseData | null,
) => {
  setEnterpriseData(
    (prev) => ({
      ...prev,
      ...(sectionIdentifier
        ? {
            [sectionIdentifier]: {
              ...prev[sectionIdentifier],
              [field]: event.target.value,
            },
          }
        : { [field]: event.target.value }),
    }),
    field,
  )
}

export const handleChangeIntegerValues = (
  field: string,
  setEnterpriseData: SetEnterpriseData,
  event: ChangeEvent<HTMLInputElement>,
  sectionIdentifier?: keyof EnterpriseData | null,
) => {
  const value = event.target.value

  if (value === '' || !isNaN(parseInt(value))) {
    const finalVal = value ? parseInt(value) : null

    setEnterpriseData(
      (prev) => ({
        ...prev,
        ...(sectionIdentifier
          ? {
              [sectionIdentifier]: {
                ...prev[sectionIdentifier],
                [field]: finalVal,
              },
            }
          : { [field]: finalVal }),
      }),
      field,
    )
  } else {
    event.preventDefault()
  }
}

export const handleChangeDecimalValues = (
  field: string,
  setEnterpriseData: SetEnterpriseData,
  event: ChangeEvent<HTMLInputElement>,
  sectionIdentifier?: keyof EnterpriseData | null,
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
        ...(sectionIdentifier
          ? {
              [sectionIdentifier]: {
                ...prev[sectionIdentifier],
                [field]: value,
              },
            }
          : { [field]: value }),
      }),
      field,
    )
  } else {
    event.preventDefault()
  }
}

export const handleChangeDateValues = (
  field: string,
  setEnterpriseData: SetEnterpriseData,
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  sectionIdentifier?: keyof EnterpriseData | null,
) => {
  const formattedVal = event.target.value || null

  setEnterpriseData(
    (prev) => ({
      ...prev,
      ...(sectionIdentifier
        ? {
            [sectionIdentifier]: {
              ...prev[sectionIdentifier],
              [field]: formattedVal,
            },
          }
        : { [field]: formattedVal }),
    }),
    field,
  )
}

export const getFieldDefaultProps = (isFieldDisabled: boolean = false) => {
  return {
    ...{
      ...defaultPropsSimpleField,
      className: cx(defaultPropsSimpleField.className, '!m-0 h-10 !py-1', {
        [disabledClassName]: isFieldDisabled,
      }),
    },
  }
}

export const getFieldErrors = (
  data: any,
  errors: { [key: string]: string[] },
) => {
  const requiredFields = ['name', 'country']

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

export const getEntityById = (data: any, id: number | null) =>
  find(data, (entry) => entry.id === id)

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
    ? cost_effectiveness_approved.toFixed(10)
    : null
}

export const getFormattedDecimalValue = (value: string | null) =>
  !isNil(value) ? Number(value).toFixed(10).toString() : value

export const getIsAgencyUser = (
  canViewOnlyOwnAgency: boolean,
  agency_id: number | undefined,
) => canViewOnlyOwnAgency && !!agency_id
