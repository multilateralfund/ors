import { Dispatch, SetStateAction } from 'react'

import { tableColumns, validationFieldsPairs } from './constants'
import {
  ProjIdentifiers,
  ProjectSpecificFields,
  ProjectData,
  CrossCuttingFields,
  SpecificFields,
  ProjectFilesObject,
  ProjectFile,
  OptionsType,
  ProjectTypeApi,
  ProjectAllVersionsFiles,
  OdsOdpFields,
  ListingProjectData,
} from './interfaces'
import { formatApiUrl, formatDecimalValue } from '@ors/helpers'
import { Cluster, ProjectFieldHistoryValue } from '@ors/types/store'

import {
  concat,
  difference,
  filter,
  find,
  flatMap,
  fromPairs,
  get,
  isArray,
  isNaN,
  isNil,
  keys,
  lowerCase,
  map,
  min,
  omit,
  pick,
  reduce,
} from 'lodash'
import {
  ITooltipParams,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community'
import dayjs from 'dayjs'

const getFieldId = <T>(
  field: ProjectSpecificFields,
  data: T,
  projectData?: ProjectTypeApi,
) => {
  const fieldName = field.read_field_name === 'group' ? 'name_alt' : 'name'
  return find(formatOptions(field, projectData), {
    [fieldName]: data[field.read_field_name as keyof T]?.toString(),
  })?.id
}

export const getDefaultValues = <T>(
  fields: ProjectSpecificFields[],
  data?: T,
  projectData?: ProjectTypeApi,
) =>
  reduce(
    fields,
    (acc: any, field) => {
      const dataType = field.data_type
      const fieldName = field.write_field_name

      if (data) {
        acc[fieldName] =
          dataType === 'drop_down'
            ? getFieldId<T>(field, data, projectData)
            : dataType === 'boolean'
              ? (data[fieldName] ?? false)
              : data[fieldName]
      } else {
        acc[fieldName] =
          dataType === 'text' ? '' : dataType === 'boolean' ? false : null
      }
      return acc
    },
    {},
  )

export const canGoToSecondStep = (projIdentifiers: ProjIdentifiers) =>
  !!(
    projIdentifiers.country &&
    projIdentifiers.meeting &&
    projIdentifiers.cluster &&
    projIdentifiers.agency &&
    projIdentifiers.lead_agency
  ) && !getAgencyErrorType(projIdentifiers)

export const getIsSaveDisabled = (
  projIdentifiers: ProjIdentifiers,
  crossCuttingFields: CrossCuttingFields,
) => {
  const canLinkToBp = canGoToSecondStep(projIdentifiers)
  const {
    project_type,
    sector,
    title,
    total_fund,
    support_cost_psc,
    project_start_date,
    project_end_date,
  } = crossCuttingFields

  return (
    !canLinkToBp ||
    !(project_type && sector && title) ||
    Number(total_fund) < Number(support_cost_psc) ||
    dayjs(project_start_date).isAfter(dayjs(project_end_date))
  )
}

const filterSubstancesOptions = (options: any, group_id: number | null) =>
  filter(options, (option) => option.group_id === group_id)
const filterBlendsOptions = (options: any, group_id: number | null) =>
  filter(options, (option) => option.substance_groups.includes(group_id))

export const formatOptions = (
  field: ProjectSpecificFields,
  data?: any,
): OptionsType[] => {
  const options = field.options as
    | OptionsType[]
    | Record<'substances' | 'blends', (OptionsType & { composition: string })[]>

  const groupValue = data ? data.group_id || data.group : null

  return field.write_field_name === 'ods_display_name' && !isArray(options)
    ? concat(
        data
          ? filterSubstancesOptions(options.substances, groupValue)
          : options.substances,
        data ? filterBlendsOptions(options.blends, groupValue) : options.blends,
      ).map((option) => {
        return {
          ...option,
          id: `${option.baseline_type}-${option.id}`,
          label:
            option.baseline_type === 'blend'
              ? option.name + ' (' + option.composition + ')'
              : option.name,
        }
      })
    : map(options, (option) =>
        isArray(option) ? { id: option[0], name: option[1] } : option,
      )
}

export const getSectionFields = (
  fields: ProjectSpecificFields[],
  section: string,
) => filter(fields, (field) => field.section === section)

export const formatNumberColumns = (
  params: ValueGetterParams | ITooltipParams | ValueFormatterParams,
  field: string,
  valueFormatter?: {
    maximumFractionDigits: number
    minimumFractionDigits: number
  },
) => {
  const value = params.data[field]

  return !isNil(value) && !isNaN(parseFloat(value))
    ? valueFormatter
      ? formatDecimalValue(parseFloat(value), valueFormatter)
      : formatDecimalValue(parseFloat(value))
    : ''
}

const normalizeValues = (data: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value === '' ? null : value,
    ]),
  )

const normalizeOdsOdp = (
  projectSpecificFields: SpecificFields,
  specificFieldsAvailable: string[],
  projectFields: ProjectSpecificFields[],
) =>
  map(projectSpecificFields.ods_odp, (field, index) => {
    const odsDisplayName = get(field, 'ods_display_name') ?? ''
    const baselineTechValue = odsDisplayName.split('-')?.[1]
    const baselineTechObj = odsDisplayName.includes('substance')
      ? { ods_substance_id: baselineTechValue, ods_blend_id: undefined }
      : { ods_substance_id: undefined, ods_blend_id: baselineTechValue }

    const oldData = defaultOldFields(
      field,
      specificFieldsAvailable,
      projectFields,
    )

    return {
      ...pick(field, specificFieldsAvailable),
      ...(specificFieldsAvailable.includes('ods_display_name')
        ? baselineTechObj
        : {}),
      ...oldData,
      sort_order: index + 1,
    }
  })

const formatActualData = (data: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, !value ? null : value]),
  )

export const formatSubmitData = (
  projectData: ProjectData,
  setProjectData: Dispatch<SetStateAction<ProjectData>>,
  specificFields: ProjectSpecificFields[],
  projectFields: ProjectSpecificFields[],
) => {
  const {
    projIdentifiers,
    bpLinking,
    crossCuttingFields,
    projectSpecificFields,
  } = projectData

  const filteredFields = filter(specificFields, (field) => !field.is_actual)
  const specificFieldsAvailable = map(filteredFields, 'write_field_name')

  const filteredActualFields = filter(
    specificFields,
    (field) => field.is_actual,
  )
  const specificActualFieldsAvailable = map(
    filteredActualFields,
    'write_field_name',
  )

  const crtProjectSpecificFields = getCrtProjectSpecificFields(
    filteredFields,
    projectData,
    specificFieldsAvailable,
  )
  const updatedOldSpecificFieldsValues = defaultOldFields(
    projectData.projectSpecificFields,
    [...specificFieldsAvailable, ...specificActualFieldsAvailable],
    projectFields,
  )

  const hasOdsOdpFields = filteredFields.find(
    (field) => field.table === 'ods_odp',
  )
  const updatedOdsOdpValues = hasOdsOdpFields
    ? normalizeOdsOdp(
        projectSpecificFields,
        specificFieldsAvailable,
        projectFields,
      )
    : []

  setProjectData((prevData) => ({
    ...prevData,
    projectSpecificFields: {
      ...prevData.projectSpecificFields,
      ...updatedOldSpecificFieldsValues,
      ods_odp: map(updatedOdsOdpValues, (ods_odp) =>
        omit(normalizeValues(ods_odp), ['ods_blend_id', 'ods_substance_id']),
      ),
    },
  }))

  return {
    ...projIdentifiers,
    bp_activity: bpLinking.bpId,
    ...normalizeValues(crossCuttingFields),
    ...normalizeValues(crtProjectSpecificFields),
    ...updatedOldSpecificFieldsValues,
    ods_odp: map(updatedOdsOdpValues, (ods_odp) =>
      omit(normalizeValues(ods_odp), ['id', 'ods_display_name']),
    ),
  }
}

export const formatApprovalData = (
  projectData: ProjectData,
  setProjectData: Dispatch<SetStateAction<ProjectData>>,
  specificFields: ProjectSpecificFields[],
  projectFields: ProjectSpecificFields[],
) => {
  const { crossCuttingFields, projectSpecificFields, approvalFields } =
    projectData

  const fields = filter(
    specificFields,
    (field) => field.table === 'ods_odp' || field.section === 'Approval',
  )
  const specificFieldsAvailable = [
    ...map(fields, 'write_field_name'),
    'total_fund',
    'support_cost_psc',
  ]

  const crtProjectSpecificFields = pick(
    {
      ...crossCuttingFields,
      ...approvalFields,
    },
    specificFieldsAvailable,
  )

  const hasOdsOdpFields = fields.find((field) => field.table === 'ods_odp')
  const updatedOdsOdpValues = hasOdsOdpFields
    ? normalizeOdsOdp(
        projectSpecificFields,
        specificFieldsAvailable,
        projectFields,
      )
    : []

  setProjectData((prevData) => ({
    ...prevData,
    projectSpecificFields: {
      ...prevData.projectSpecificFields,
      ods_odp: map(
        updatedOdsOdpValues,
        (ods_odp) =>
          omit(normalizeValues(ods_odp), [
            'ods_blend_id',
            'ods_substance_id',
          ]) as OdsOdpFields,
      ),
    },
  }))

  return {
    ...normalizeValues(crtProjectSpecificFields),
    ods_odp: map(updatedOdsOdpValues, (ods_odp) =>
      omit(normalizeValues(ods_odp), ['id', 'ods_display_name']),
    ),
  }
}

export const getActualData = (
  projectData: ProjectData,
  setProjectData: Dispatch<SetStateAction<ProjectData>>,
  specificFields: ProjectSpecificFields[],
  projectFields: ProjectSpecificFields[],
) => {
  const filteredFields = filter(specificFields, (field) => field.is_actual)
  const specificFieldsAvailable = map(filteredFields, 'write_field_name')
  const nonActualFields = filter(specificFields, (field) => !field.is_actual)
  const nonActualFieldsAvailable = map(nonActualFields, 'write_field_name')

  const crtProjectSpecificFields = getCrtProjectSpecificFields(
    filteredFields,
    projectData,
    specificFieldsAvailable,
  )
  const updatedOldSpecificFieldsValues = defaultOldFields(
    projectData.projectSpecificFields,
    [...specificFieldsAvailable, ...nonActualFieldsAvailable],
    projectFields,
  )

  setProjectData((prevData) => ({
    ...prevData,
    projectSpecificFields: {
      ...prevData.projectSpecificFields,
      ...updatedOldSpecificFieldsValues,
    },
  }))

  return {
    ...formatActualData({
      ...crtProjectSpecificFields,
      ...updatedOldSpecificFieldsValues,
    }),
  }
}

export const getProjIdentifiersErrors = (
  projIdentifiers: ProjIdentifiers,
  errors: { [key: string]: [] },
) => {
  const requiredFields = [
    'country',
    'meeting',
    'agency',
    'cluster',
    'lead_agency',
  ]

  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => requiredFields.includes(key)),
  )

  return {
    ...requiredFields.reduce((acc: any, field) => {
      acc[field] = !projIdentifiers[field as keyof ProjIdentifiers]
        ? ['This field is required.']
        : []

      return acc
    }, {}),
    ...filteredErrors,
  }
}

export const getAgencyErrorType = (
  projIdentifiers: ProjIdentifiers | ProjectTypeApi,
) => {
  const { agency, lead_agency, lead_agency_submitting_on_behalf } =
    projIdentifiers

  if (!(agency && lead_agency)) return null

  return lead_agency_submitting_on_behalf
    ? agency === lead_agency
      ? 'similar_agencies'
      : null
    : agency !== lead_agency
      ? 'different_agencies'
      : null
}

export const checkInvalidValue = (value: any) =>
  isNil(value) || value === '' || value.length === 0

const getFieldErrors = (
  fields: string[],
  data: any,
  project: ProjectTypeApi | undefined,
) =>
  fields.reduce((acc: any, field) => {
    acc[field] = checkInvalidValue(data[field as keyof typeof fields])
      ? ['title', 'project_type', 'sector'].includes(field) ||
        project?.submission_status !== 'Draft'
        ? field.includes('_actual')
          ? ['This field is not completed.']
          : ['This field is required.']
        : ['This field is required for submission.']
      : []

    return acc
  }, {})

export const getCrossCuttingErrors = (
  crossCuttingFields: CrossCuttingFields,
  errors: { [key: string]: [] },
  mode: string,
  project: ProjectTypeApi | undefined,
) => {
  const requiredFields = [
    'title',
    'project_type',
    'sector',
    'description',
    'is_lvc',
    'total_fund',
    'support_cost_psc',
    'project_start_date',
    'project_end_date',
  ]

  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => requiredFields.includes(key)),
  )

  const { total_fund, support_cost_psc, project_start_date, project_end_date } =
    crossCuttingFields

  const fieldsToCheck =
    mode === 'edit' ? requiredFields : requiredFields.slice(0, 3)

  return {
    ...getFieldErrors(fieldsToCheck, crossCuttingFields, project),
    ...(Number(total_fund) < Number(support_cost_psc) && {
      support_cost_psc: ['Value cannot be greater than project funding.'],
    }),
    ...(dayjs(project_end_date).isBefore(dayjs(project_start_date)) && {
      project_end_date: ['Start date cannot be later than end date.'],
    }),
    ...filteredErrors,
  }
}

export const getApprovalErrors = (
  approvalData: SpecificFields,
  specificFields: ProjectSpecificFields[] | undefined = [],
  errors: { [key: string]: [] },
  project: ProjectTypeApi | undefined,
) => {
  const requiredFields = [
    'meeting_approved',
    'decision',
    'excom_provision',
    'date_completion',
  ]

  const filteredErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => requiredFields.includes(key)),
  )

  const allErrors = {
    ...getFieldErrors(requiredFields, approvalData, project),
    ...(dayjs(approvalData.date_completion).isBefore(dayjs(), 'day') && {
      date_completion: ['Cannot be a past date.'],
    }),
    ...filteredErrors,
  }

  return Object.entries(allErrors).reduce(
    (acc, [key, errMsg]) => {
      const field = specificFields.find(
        ({ write_field_name }) => write_field_name === key,
      )

      if (field) {
        acc[field.label || key] = errMsg as string[]
      }

      return acc
    },
    {} as Record<string, string[]>,
  )
}

export const hasSpecificField = (
  specificFields: ProjectSpecificFields[],
  field: string,
) => find(specificFields, (crtField) => crtField.write_field_name === field)

export const getDefaultImpactErrors = (
  projectSpecificFields: SpecificFields,
  specificFields: ProjectSpecificFields[],
) => {
  const errorMsg = 'Number cannot be greater than the total one.'

  return Object.fromEntries(
    validationFieldsPairs
      .filter(
        ([key, totalKey]) =>
          hasSpecificField(specificFields, key) &&
          hasSpecificField(specificFields, totalKey) &&
          (projectSpecificFields[key] ?? 0) >
            (projectSpecificFields[totalKey] ?? 0),
      )
      .map(([key]) => [key, [errorMsg]]),
  )
}

export const hasSectionErrors = (errors: { [key: string]: string[] }) =>
  Object.values(errors).some((errors) => errors.length > 0)

export const getFieldLabel = (
  specificFields: ProjectSpecificFields[],
  field: string,
) => {
  const specificField = specificFields.find(
    ({ write_field_name }) => write_field_name === field,
  )
  return specificField?.label ?? field
}

export const getSpecificFieldsErrors = (
  projectSpecificFields: SpecificFields,
  specificFields: ProjectSpecificFields[],
  errors: { [key: string]: [] },
  mode: string,
  canEditApprovedProjects: boolean,
  project?: ProjectTypeApi,
) => {
  const isEditMode = project && mode === 'edit'
  const version = isEditMode ? project.version : 1

  const fieldNames = map(
    filter(
      specificFields,
      ({ table, editable_in_versions, data_type }) =>
        table === 'project' &&
        data_type !== 'boolean' &&
        (canEditApprovedProjects ||
          (isEditMode && project.version > 3) ||
          editable_in_versions.includes(version)),
    ),
    'write_field_name',
  ) as string[]

  const defaultImpactErrors =
    getDefaultImpactErrors(projectSpecificFields, specificFields) ?? {}

  const sectionErrors =
    mode === 'edit' && project
      ? (getFieldErrors(fieldNames, projectSpecificFields, project) ?? {})
      : {}
  const updatedErrors = { ...sectionErrors, ...defaultImpactErrors, ...errors }

  const filteredErrors = Object.entries(updatedErrors)
    .filter(([key]) => fieldNames.includes(key))
    .reduce(
      (acc, [key, errMsg]) => {
        const field = specificFields.find(
          ({ write_field_name }) => write_field_name === key,
        )

        if (field) {
          const { section, label } = field

          if (!acc[section]) {
            acc[section] = {}
          }
          acc[section][label || key] = errMsg
        }

        return acc
      },
      {} as Record<string, Record<string, any>>,
    )

  return filteredErrors
}

export const getNonFieldErrors = (errors: { [key: string]: [] }) => {
  const nonFieldsOdsOdpErrors = errors?.['ods_odp']?.find(
    (err) => Object.keys(err)[0] === 'non_field_errors',
  )
  return [
    ...(errors?.['non_field_errors'] || []),
    ...(nonFieldsOdsOdpErrors?.['non_field_errors'] || []),
  ]
}

export const getFileFromMetadata = async (fileMeta: {
  download_url: string
  filename: string
}): Promise<File> => {
  const res = await fetch(formatApiUrl(fileMeta.download_url), {
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file: ${res.statusText}`)
  }

  const blob = await res.blob()

  const contentType =
    res.headers.get('Content-Type') || 'application/octet-stream'

  return new File([blob], fileMeta.filename, { type: contentType })
}

export const formatErrors = (errors: { [key: string]: string[] }) =>
  Object.entries(errors)
    .filter(([, errorMsgs]) => errorMsgs.length > 0)
    .flatMap(([field, errorMsgs]) =>
      errorMsgs.map((errMsg, idx) => ({
        id: `${field}-${idx}`,
        message: `${tableColumns[field] ?? field}: ${errMsg}`,
      })),
    )

export const getHasNoFiles = (
  id: number,
  files?: ProjectFilesObject,
  projectFiles?: ProjectFile[],
) => {
  const crtVersionFiles = filter(
    projectFiles,
    (file) =>
      file.project_id === id && !files?.deletedFilesIds?.includes(file.id),
  )

  return files?.newFiles?.length === 0 && crtVersionFiles.length === 0
}

export const getMenus = (
  permissions: Record<string, boolean>,
  projectData?: ListingProjectData,
) => {
  const {
    canViewBp,
    canUpdateBp,
    canViewEnterprises,
    canEditProjectEnterprise,
    canUpdatePostExcom,
    canViewMetaProjects,
  } = permissions
  const { projectId, projectSubmissionStatus, projectStatus } =
    projectData ?? {}

  return [
    {
      title: 'Planning',
      menuItems: [
        {
          title: 'View business plans',
          url: '/business-plans',
          disabled: !canViewBp,
        },
        {
          title: 'New business plan',
          url: '/business-plans/upload',
          disabled: !canUpdateBp,
        },
      ],
    },
    {
      title: 'Approved Projects',
      menuItems: [
        {
          title: 'Update MYA data',
          url: '/projects-listing/update-mya-data',
          disabled: !canViewMetaProjects,
        },
        {
          title: 'Update post ExCom fields',
          url: `/projects-listing/${projectId}/post-excom-update`,
          disabled:
            !canUpdatePostExcom ||
            !projectId ||
            projectSubmissionStatus !== 'Approved' ||
            projectStatus === 'Closed' ||
            projectStatus === 'Transferred',
        },
        {
          title: 'Update project enterprises',
          url: `/projects-listing/projects-enterprises/${projectId}`,
          disabled:
            !canEditProjectEnterprise ||
            !projectId ||
            projectSubmissionStatus !== 'Approved',
        },
        {
          title: 'Manage enterprises',
          url: `/projects-listing/enterprises`,
          disabled: !canViewEnterprises,
        },
        { title: 'Transfer a project', url: null, disabled: true },
      ],
    },
    {
      title: 'Reporting',
      menuItems: [
        { title: 'Create Annual Progress Report', url: null, disabled: true },
        { title: 'Raise a PCR', url: null, disabled: true },
      ],
    },
  ]
}

export const getProduction = (clusters: Cluster[], clusterId: number | null) =>
  find(clusters, (cluster) => cluster.id === clusterId)?.production

export const formatFiles = (
  files: ProjectAllVersionsFiles[] = [],
  project_id: number,
) => {
  const sortedFiles =
    files?.sort((file1, file2) => file1.version - file2.version) ?? []

  return flatMap(sortedFiles, (file) =>
    map(file.files, (crtFile) => {
      return {
        ...crtFile,
        editable: crtFile.editable && file.id === project_id,
      }
    }),
  )
}

export const canViewField = (viewableFields: string[], field: string) =>
  viewableFields.includes(field)

export const canEditField = (editableFields: string[], field: string) =>
  editableFields.includes(field)

export const hasFields = (
  projectFields: any,
  viewableFields: string[],
  section: string,
  includeAllFields: boolean = true,
  excludedFields?: string[],
  fieldToCheck: string = 'section',
) => {
  const allFields = isArray(projectFields) ? projectFields : projectFields?.data

  const fields = filter(viewableFields, (field) => {
    const crtFieldData = find(
      allFields,
      (projField) =>
        projField.write_field_name === field && field !== 'sort_order',
    )

    return (
      crtFieldData?.[fieldToCheck] === section &&
      (includeAllFields ? true : !excludedFields?.includes(field))
    )
  })

  return fields.length > 0
}

export const pluralizeWord = (data: any[] = [], word: string) =>
  data.length > 1 ? word + 's' : word

export const formatProjectFields = (projectFields: any) =>
  isArray(projectFields) ? projectFields : projectFields?.data

export const defaultOldFields = (
  data: any,
  specificFieldsAvailable: string[],
  projectFields: ProjectSpecificFields[],
) => {
  const oldSpecificFieldsValues = omit(data, [
    ...specificFieldsAvailable,
    'ods_odp',
  ])
  const oldFields = projectFields.filter((field) =>
    keys(oldSpecificFieldsValues).includes(field.write_field_name),
  )

  return getDefaultValues<ProjectTypeApi>(oldFields)
}

const getCrtProjectSpecificFields = (
  filteredFields: ProjectSpecificFields[],
  projectData: ProjectData,
  specificFieldsAvailable: string[],
) => {
  const { projectSpecificFields } = projectData

  const booleanFields = filter(
    filteredFields,
    (field) => field.data_type === 'boolean',
  )
  const booleanFieldsAvailable = map(booleanFields, 'write_field_name')
  const booleanNullFields = difference(
    booleanFieldsAvailable,
    keys(projectSpecificFields),
  )
  const booleanNullValues = fromPairs(
    booleanNullFields.map((field) => [field, false]),
  )

  return {
    ...pick(projectSpecificFields, specificFieldsAvailable),
    ...booleanNullValues,
  }
}

export const filterClusterOptions = (
  clusters: Cluster[],
  canViewProdProjects: boolean,
) => filter(clusters, (cluster) => canViewProdProjects || !cluster.production)

export const getPaginationSelectorOpts = (
  count: number,
  maxResults: number,
) => {
  const actualMaxResults = min([count, maxResults]) ?? maxResults

  const nrResultsOpts = [50, 100, 150, 200, 250, 500, 1000]
  const filteredNrResultsOptions = nrResultsOpts.filter(
    (option) => option <= actualMaxResults,
  )

  return count < maxResults
    ? [...filteredNrResultsOptions, count]
    : filteredNrResultsOptions
}

export const getAreFiltersApplied = (filters: Record<string, any>) =>
  Object.values(filters).find(
    (filter) => Array.isArray(filter) && filter.length > 0,
  )

export const formatEntity = (currentEntity: any = [], field: string = 'id') =>
  new Map<number, any>(
    currentEntity.map((entity: any) => [entity[field], entity]),
  )

export const getFieldData = (
  data: ProjectSpecificFields[],
  fieldName: string,
) => find(data, (field) => field.write_field_name === fieldName)

export const getHistoryItemValue = (value: any, fieldName: string): any => {
  if (lowerCase(fieldName).includes('date') && dayjs(value).isValid()) {
    return dayjs(value).format('DD/MM/YYYY')
  } else if (
    value &&
    typeof value === 'object' &&
    value.hasOwnProperty('title')
  ) {
    return value.title
  } else if (
    value &&
    typeof value === 'object' &&
    value.hasOwnProperty('name')
  ) {
    return value.name
  } else if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  } else if (Array.isArray(value)) {
    return value.map((v) => getHistoryItemValue(v, fieldName)).join(', ')
  }
  return value
}

export const filterHistoryField = (history: ProjectFieldHistoryValue[]) =>
  history.filter(
    ({ version, post_excom_meeting }) => version === 3 || !!post_excom_meeting,
  )

export const getLatesValueByMeeting = (history: ProjectFieldHistoryValue[]) =>
  Object.values(
    history.reduce(
      (acc, item) => {
        const key = item.post_excom_meeting ?? '-'
        if (!acc[key] || item.version > acc[key].version) {
          acc[key] = item
        }
        return acc
      },
      {} as Record<string, any>,
    ),
  ).sort((a, b) => b.version - a.version)

export const hasExcomUpdate = (
  history: ProjectFieldHistoryValue[],
  fieldName: string,
) => {
  const filteredHistory = filterHistoryField(history)
  const latestByMeeting = getLatesValueByMeeting(filteredHistory)

  const historicValues =
    latestByMeeting.reduce((acc, item) => {
      acc.add(getHistoryItemValue(item.value, fieldName))
      return acc
    }, new Set()) ?? new Set()

  return historicValues.size > 1
}

export const formatFieldsHistory = (
  history: ProjectFieldHistoryValue[],
  dataType: string,
) =>
  map(history, (historyItem) => ({
    ...historyItem,
    value:
      dataType === 'decimal'
        ? !isNil(historyItem.value)
          ? formatDecimalValue(parseFloat(historyItem.value), {
              maximumFractionDigits: 10,
              minimumFractionDigits: 2,
            })
          : '-'
        : dataType === 'boolean'
          ? historyItem.value
            ? 'Yes'
            : 'No'
          : historyItem.value,
  }))

export const getIndividualConsiderationOpts = () => {
  const options = ['Blanket consideration', 'Individual consideration', 'N/A']

  return map(options, (option, index) => ({
    id: index === 0 ? 'Blanket' : option,
    value: option,
    name: option,
  }))
}
