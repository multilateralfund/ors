import { PendingEditType } from './BPEditTable'
import { filter, find, get, isEqual, isObject, map, isNil } from 'lodash'
import { ValueSetterParams } from 'ag-grid-community'

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

export const getOptionLabel = (data: any, option: any, field: string = 'id') =>
  isObject(option)
    ? get(option, 'name')
    : find(data, { [field]: option })?.name || ''

export const isOptionEqualToValue = (option: any, value: any) =>
  isObject(value) ? isEqual(option, value) : option.id === value

export const isOptionEqualToValueByName = (option: any, value: any) =>
  isObject(value) ? isEqual(option, value) : option.name === value

export const isOptionEqualToValueByCode = (option: any, value: any) =>
  isObject(value) ? isEqual(option, value) : option.code === value

export const getClusterTypesOpts = (cluster_id: number, clusterOptions: any) =>
  get(find(clusterOptions, { cluster_id }), 'types', [])

export const getTypeSectorsOpts = (type_id: number, typesOptions: any) =>
  get(find(typesOptions, { type_id }), 'sectors', [])

export const getSectorSubsectorsOpts = (
  sector_id: number,
  sectorOptions: any,
) => get(find(sectorOptions, { id: sector_id }), 'subsectors', [])

export const emptyFieldData = (data: any, field: string) => {
  data[field + '_id'] = null
  data[field] = {}

  if (field !== 'subsector') {
    data[field + '_code'] = ''
  }
}

export const updateFieldData = (
  opts: any,
  data: any,
  colIdentifier: string,
  newId: number,
) => {
  const currentDataObj = find(opts, { id: newId })

  data[colIdentifier + '_id'] = newId
  data[colIdentifier] = currentDataObj

  if (['project_type', 'sector'].includes(colIdentifier)) {
    data[colIdentifier + '_code'] = currentDataObj?.code || ''
  }
}

const shouldEmptyProjectType = (
  params: ValueSetterParams,
  newVal: number,
  opts: any,
) => {
  const projectTypesOpts = getClusterTypesOpts(newVal, opts)
  const projectTypesOptsIds = map(projectTypesOpts, 'type_id')

  return !projectTypesOptsIds.includes(params.data?.project_type_id)
}

const shouldEmptySector = (
  params: ValueSetterParams,
  newVal: number,
  opts: any,
) => {
  const projectTypesOpts = getClusterTypesOpts(
    params.data?.project_cluster_id,
    opts,
  )
  const sectorOpts = getTypeSectorsOpts(newVal, projectTypesOpts)
  const sectorOptsIds = map(sectorOpts, 'sector_id')

  return !sectorOptsIds.includes(params.data?.sector_id)
}

const shouldEmptySubsector = (
  params: ValueSetterParams,
  newVal: number,
  opts: any,
) => {
  const subsectorOpts = getSectorSubsectorsOpts(newVal, opts)
  const subsectorOptsIds = map(subsectorOpts, 'id')

  return !subsectorOptsIds.includes(params.data?.subsector_id)
}

export const valueSetter = (
  params: ValueSetterParams,
  colIdentifier: string,
  data: any,
  opts?: any,
  setPendingEdit?: (value: PendingEditType) => void,
) => {
  const newVal = params.newValue
  const fieldsForCustomUpdate = ['project_cluster', 'project_type', 'sector']

  if ([...fieldsForCustomUpdate, 'subsector'].includes(colIdentifier)) {
    const optionsIds = map(data, 'id')

    if (!optionsIds.includes(newVal)) {
      setPendingEdit?.({
        field: colIdentifier,
        newValue: newVal,
        rowId: params.data?.row_id,
        isOtherValue: true,
      })

      return false
    }
  }

  if (!fieldsForCustomUpdate.includes(colIdentifier)) {
    updateFieldData(data, params.data, colIdentifier, newVal)
  } else {
    const shouldUpdateChildren = {
      project_cluster:
        !isNil(params.data?.project_type_id) &&
        shouldEmptyProjectType(params, newVal, opts),
      project_type:
        !isNil(params.data?.sector_id) &&
        shouldEmptySector(params, newVal, opts),
      sector:
        !isNil(params.data?.subsector_id) &&
        shouldEmptySubsector(params, newVal, opts),
    }

    if (
      shouldUpdateChildren[colIdentifier as keyof typeof shouldUpdateChildren]
    ) {
      setPendingEdit?.({
        field: colIdentifier,
        newValue: newVal,
        rowId: params.data?.row_id,
        isOtherValue: false,
      })

      return false
    } else {
      updateFieldData(data, params.data, colIdentifier, newVal)
    }
  }

  return true
}

export const lvcValueSetter = (params: any, colIdentifier: string) => {
  params.data[colIdentifier] = params.newValue

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

export const statusValueSetter = (params: any, statuses: any) => {
  const newVal = params.newValue

  const currentDataObj = find(statuses, {
    id: newVal,
  })

  params.data.status = currentDataObj?.id || ''
  params.data.status_display = currentDataObj?.name || ''

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
