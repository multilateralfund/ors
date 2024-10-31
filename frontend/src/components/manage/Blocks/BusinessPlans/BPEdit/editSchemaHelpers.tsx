import { filter, find, get, isEqual, isObject, map } from 'lodash'

export const agFormatValue = (value: any) => value?.id || ''
export const agFormatNameValue = (value: any) => value?.name || ''
export const agFormatValueTags = (value: any) =>
  value?.length > 0 ? value : ''

export const getOptions = (value: any, options: Array<any>) => {
  const formattedValue = map(value, (val) =>
    isObject(val) ? get(val, 'id') : val,
  )

  return filter(options, (option) => !formattedValue.includes(option.id))
}

export const getOptionLabel = (data: any, option: any) =>
  isObject(option)
    ? get(option, 'name')
    : find(data, { id: option })?.name || ''

export const getOptionLabelByName = (data: any, option: any) =>
  isObject(option)
    ? get(option, 'name')
    : find(data, { name: option })?.name || ''

export const isOptionEqualToValue = (option: any, value: any) =>
  isObject(value) ? isEqual(option, value) : option.id === value

export const isOptionEqualToValueByName = (option: any, value: any) =>
  isObject(value) ? isEqual(option, value) : option.name === value

const updateSubsector = (params: any, value: any, subsectors: any) => {
  const subsectorsSectorIds = map(
    subsectors,
    (subsector) => subsector.sector_id,
  )

  if (!subsectorsSectorIds.includes(value)) {
    params.data.subsector_id = null
    params.data.subsector = {}
  }
}

export const valueSetter = (
  params: any,
  colIdentifier: string,
  data: any,
  extraData?: any,
) => {
  const newVal = params.newValue

  const currentDataObj = find(data, {
    id: newVal,
  })

  params.data[colIdentifier + '_id'] = newVal

  if (['project_type', 'sector'].includes(colIdentifier)) {
    params.data[colIdentifier + '_code'] = currentDataObj?.code
  }

  if (colIdentifier === 'sector') {
    updateSubsector(params, newVal, extraData)
  }

  params.data[colIdentifier] = currentDataObj

  return true
}

export const substancesValueSetter = (params: any, substances: any) => {
  const newValIds = params.newValue?.map((newVal: any) =>
    isObject(newVal) ? get(newVal, 'id') : newVal,
  )

  params.data.substances = newValIds
  params.data.substances_display = newValIds?.map(
    (id: number) =>
      find(substances, {
        id,
      })?.name,
  )

  return true
}

export const remarksValueSetter = (params: any) => {
  params.data.remarks = params.newValue

  return true
}

export const commentSecretariatValueSetter = (params: any) => {
  params.data.comment_secretariat = params.newValue ?? ''

  return true
}

export const statusValueSetter = (params: any, statuses: any) => {
  const newVal = params.newValue

  const currentDataObj = find(statuses, {
    id: newVal,
  })

  params.data.status = currentDataObj?.id
  params.data.status_display = currentDataObj?.name

  return true
}

export const MYAValueSetter = (params: any, multiYearFilterOptions: any) => {
  const newVal = params.newValue

  const currentDataObj = find(multiYearFilterOptions, {
    name: newVal,
  })

  params.data.is_multi_year_display = currentDataObj?.fullName
  params.data.is_multi_year = currentDataObj?.id

  return true
}

export const commentsValueSetter = (params: any) => {
  const newValNames = params.newValue?.map((newVal: any) =>
    isObject(newVal) ? get(newVal, 'id') : newVal,
  )
  params.data.comment_types = newValNames

  return true
}
