import { pcrFieldsMapping, pcrFieldsErrorsMapping } from './constants'
import {
  OptionsType,
  PCRAlternativeTechnologyType,
  PCREnterpriseType,
  PCREquipmentType,
  PCRSummaryOfKeyDataType,
} from './interfaces'

import { find, findIndex, forEach, lowerCase, map, reduce, sumBy } from 'lodash'

export type PCRSummaryProjectPayload = {
  project_id: number
  funds_disbursed?: string
  planned_date_of_completion?: string
  alternative_technologies?: PCRAlternativeTechnologyType[]
  enterprises?: PCREnterpriseType[]
  equipments?: PCREquipmentType[]
}

const hasText = (value: string) => value.trim() !== ''

const cleanNumber = (value: string) => {
  const cleanedValue = value.replace(/,/g, '').trim()
  return cleanedValue || undefined
}

const cleanDate = (value: string) => value.trim() || undefined

const cleanAlternativeTechnologies = (
  entries: PCRAlternativeTechnologyType[],
) =>
  entries.filter(
    (entry) => entry.substance_from !== null || entry.substance_to !== null,
  )

const cleanEnterprises = (entries: PCREnterpriseType[]) =>
  entries
    .map((entry) => ({
      name: entry.name.trim(),
      address: entry.address.trim(),
    }))
    .filter((entry) => hasText(entry.name) || hasText(entry.address))

const cleanEquipments = (entries: PCREquipmentType[]) =>
  entries
    .map((entry) => ({
      name: entry.name.trim(),
      description: entry.description.trim(),
      disposal_type: entry.disposal_type,
      disposal_date: entry.disposal_date,
    }))
    .filter(
      (entry) =>
        hasText(entry.name) ||
        hasText(entry.description) ||
        entry.disposal_type !== null ||
        hasText(entry.disposal_date),
    )

export const buildPCRProjectPayload = (
  entry: PCRSummaryOfKeyDataType,
): PCRSummaryProjectPayload => {
  const payload: PCRSummaryProjectPayload = {
    project_id: entry.project_id,
  }
  const fundsDisbursed = cleanNumber(entry.funds_disbursed)
  const plannedDateOfCompletion = cleanDate(entry.planned_date_of_completion)
  const alternativeTechnologies = cleanAlternativeTechnologies(
    entry.alternative_technologies,
  )
  const enterprises = cleanEnterprises(entry.enterprises)
  const equipments = cleanEquipments(entry.equipments)

  if (fundsDisbursed) {
    payload.funds_disbursed = fundsDisbursed
  }
  if (plannedDateOfCompletion) {
    payload.planned_date_of_completion = plannedDateOfCompletion
  }
  if (alternativeTechnologies.length > 0) {
    payload.alternative_technologies = alternativeTechnologies
  }
  if (enterprises.length > 0) {
    payload.enterprises = enterprises
  }
  if (equipments.length > 0) {
    payload.equipments = equipments
  }

  return payload
}

export const getOtherOptionId = (options: OptionsType[]) =>
  find(options, (option) => lowerCase(option.name).includes('other'))?.id

export const formatOptions = (options: [string, string][]) =>
  map(options, (option) => ({
    id: option[0],
    name: option[1],
  }))

export const formatAgencyData = <T extends { agency_id: number }>(
  data: T[],
  subField: keyof T,
) =>
  reduce(
    data,
    (acc: Record<string, any>[], entry) => {
      forEach(entry[subField] as object[], (subEntry) => {
        acc.push({ agency_id: entry.agency_id, ...subEntry })
      })

      return acc
    },
    [],
  )

const checkHasErrors = (entry: Record<string, any>) =>
  entry && Object.keys(entry).length > 0

export const hasSectionErrors = (errors: Record<string, any>) =>
  Object.values(errors).some((error) => {
    if (!Array.isArray(error)) {
      return Object.values(error as Record<string, any>).some((nestedError) =>
        nestedError.some(
          (item: Record<string, any>) =>
            item.errors && item.errors.some(checkHasErrors),
        ),
      )
    }

    return error.some((item) => {
      if (Array.isArray(item)) {
        return item.some(checkHasErrors)
      }

      return typeof item === 'string' || checkHasErrors(item)
    })
  })

const formatNestedErrors = (
  errors: Record<string, any>,
  crtFieldNames: Record<string, string>,
  field: string,
  index: number,
) => {
  const errorFields = Object.keys(errors)

  if (errorFields.length !== 0) {
    const fieldNames = map(errorFields, (field) => crtFieldNames[field]).join(
      ', ',
    )
    const errorMessage =
      errorFields.length > 1 ? 'These fields are' : 'This field is'

    return {
      id: `${field}-${index}`,
      message: `${crtFieldNames[field]} ${index + 1} : ${fieldNames} - ${errorMessage} not valid.`,
    }
  }

  return null
}

export const formatErrors = (
  errors: { [key: string]: string[] },
  nestedField?: string,
) => {
  const fieldNames = { ...pcrFieldsMapping, ...pcrFieldsErrorsMapping }

  return Object.entries(errors)
    .filter(([, error]) => error.length > 0)
    .flatMap(([field, error]) =>
      error
        .flatMap((nestedError, index) => {
          if (typeof nestedError === 'string') {
            return {
              id: `${field}-${index}`,
              message: `${fieldNames[field]}: ${nestedError}`,
            }
          } else {
            if (Array.isArray(nestedError)) {
              return reduce(
                nestedError,
                (acc: any[], entry: Record<string, any>, nestedIndex) => [
                  ...acc,
                  formatNestedErrors(entry, fieldNames, field, nestedIndex),
                  ...map(entry[nestedField!], (nestedEntry, deepNestedIndex) =>
                    formatNestedErrors(
                      nestedEntry,
                      fieldNames,
                      nestedField!,
                      deepNestedIndex,
                    ),
                  ),
                ],
                [],
              )
            }

            if (Object.keys(nestedError).length !== 0) {
              return formatNestedErrors(nestedError, fieldNames, field, index)
            }

            return null
          }
        })
        .filter(Boolean),
    )
}

export const getErrorIndex = (
  sectionData: any,
  field: string,
  crtAgencyId: number,
  index: number,
) => {
  const countByAgency = map(sectionData, (data) => ({
    [data.agency_id]: data[field].length,
  }))

  const crtAgencyIndex = findIndex(
    countByAgency,
    (entry) => Object.keys(entry)[0] === String(crtAgencyId),
  )

  return (
    sumBy(
      countByAgency.slice(0, crtAgencyIndex),
      (entry) => Object.values(entry)[0],
    ) + index
  )
}
