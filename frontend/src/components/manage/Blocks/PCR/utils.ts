import {
  OptionsType,
  PCRAlternativeTechnologyType,
  PCREnterpriseType,
  PCREquipmentType,
  PCRSummaryOfKeyDataType,
} from './interfaces'
import { find, lowerCase } from 'lodash'

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
