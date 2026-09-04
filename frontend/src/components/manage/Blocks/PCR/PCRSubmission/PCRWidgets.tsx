import { ChangeEvent } from 'react'

import SectionErrorIndicator from '@ors/components/ui/SectionTab/SectionErrorIndicator'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { FieldErrorIndicator } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { onTextareaFocus } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { STYLE } from '@ors/components/manage/Blocks/Replenishment/Inputs/constants'
import {
  defaultProps,
  defaultPropsSimpleField,
  formatClassName,
  textAreaClassname,
} from '@ors/components/manage/Blocks/ProjectsListing/constants'
import { pcrFieldsMapping } from '../constants'
import { hasSectionErrors } from '../utils'
import {
  PCRData,
  WidgetPprops,
  FieldType,
  FieldHandler,
  OptionsType,
  ErrorType,
} from '../interfaces'
import { ApiAgency } from '@ors/types/api_agencies'

import { Checkbox, TextareaAutosize } from '@mui/material'
import { find, map } from 'lodash'
import cx from 'classnames'

const overviewFieldsClassName = formatClassName('min-w-56 md:min-w-72')

const additionalProperties: Record<string, Record<string, unknown>> = {
  financial_figures_status: overviewFieldsClassName,
  project_goal_achieved: overviewFieldsClassName,
  rating: overviewFieldsClassName,
  completed_by: overviewFieldsClassName,
  project_preparation: formatClassName('min-w-56 md:min-w-60'),
}

const getValue = (
  PCRData: PCRData,
  sectionIdentifier: keyof PCRData,
  field: string,
  indexes?: number[],
  subFields?: string[],
) => {
  const [dataIndex, nestedDataIndex, deepNestedDataIndex] = indexes ?? []
  const [subField, nestedField, deepNestedField] = subFields ?? []

  const indexesLength = indexes?.length
  const subfieldsLength = subFields?.length

  const sectionData = PCRData[sectionIdentifier] as Record<string, any>
  const subSectionData = sectionData[subField as string] || []

  if (indexesLength === 3 && subfieldsLength === 3) {
    const agencyData = sectionData[dataIndex]
    const nestedData = agencyData[nestedField][nestedDataIndex]
    const deepNestedData = nestedData[deepNestedField][deepNestedDataIndex]

    return deepNestedData[field]
  }

  if (indexesLength === 2 && subfieldsLength === 2) {
    const agencyData = sectionData[dataIndex]
    const nestedData = agencyData[nestedField][nestedDataIndex]

    return nestedData[field]
  }

  if (indexesLength === 1 && subfieldsLength === 1) {
    return subSectionData[dataIndex][field]
  }

  return sectionData[field]
}

export const changeField: FieldHandler = (value, section, field, setState) => {
  setState(
    (prevData) => ({
      ...prevData,
      [section]: { ...prevData[section], [field]: value },
    }),
    field,
  )
}

const changeSubsectionField: FieldHandler = (
  value,
  section,
  field,
  setState,
  indexes,
  subFields,
) => {
  const [dataIndex] = indexes ?? []
  const [subField] = subFields ?? []

  setState((prevData) => {
    const sectionData = prevData[section] as Record<string, any>
    const subSectionData = sectionData[subField] || []

    subSectionData[dataIndex] = {
      ...subSectionData[dataIndex],
      [field]: value,
    }

    return {
      ...prevData,
      [section]: {
        ...sectionData,
        [subField]: subSectionData,
      },
    }
  }, field)
}

export const changeNestedField: FieldHandler = (
  value,
  section,
  field,
  setState,
  indexes,
  subFields,
) => {
  const [dataIndex, nestedDataIndex] = indexes ?? []
  const [_, nestedField] = subFields ?? []

  setState((prevData) => {
    const sectionData = prevData[section] || []

    if (!Array.isArray(sectionData)) {
      return prevData
    }

    return {
      ...prevData,
      [section]: sectionData.map((entry: any, entryIdx) =>
        entryIdx === dataIndex
          ? {
              ...entry,
              [nestedField]: entry[nestedField]?.map(
                (nestedEntry: any, nestedEntryIdx: number) =>
                  nestedEntryIdx === nestedDataIndex
                    ? { ...nestedEntry, [field]: value }
                    : nestedEntry,
              ),
            }
          : entry,
      ),
    }
  }, field)
}

export const changeDeepNestedField: FieldHandler = (
  value,
  section,
  field,
  setState,
  indexes,
  subFields,
) => {
  const [dataIndex, nestedDataIndex, deepNestedDataIndex] = indexes ?? []
  const [_, nestedField, deepNestedField] = subFields ?? []

  setState((prevData) => {
    const sectionData = prevData[section] || []

    if (!Array.isArray(sectionData)) {
      return prevData
    }

    return {
      ...prevData,
      [section]: sectionData.map((entry: any, entryIdx) =>
        entryIdx === dataIndex
          ? {
              ...entry,
              [nestedField]: entry[nestedField]?.map(
                (nestedEntry: any, nestedEntryIdx: number) =>
                  nestedEntryIdx === nestedDataIndex
                    ? {
                        ...nestedEntry,
                        [deepNestedField]: nestedEntry[deepNestedField]?.map(
                          (deepNestedEntry: any, deepNestedEntryIdx: number) =>
                            deepNestedEntryIdx === deepNestedDataIndex
                              ? { ...deepNestedEntry, [field]: value }
                              : deepNestedEntry,
                        ),
                      }
                    : nestedEntry,
              ),
            }
          : entry,
      ),
    }
  }, field)
}

const onFieldChange: FieldHandler = (
  value,
  section,
  field,
  setState,
  indexes,
  subFields,
) => {
  const indexesLength = indexes?.length
  const subfieldsLength = subFields?.length

  if (indexesLength === 3 && subfieldsLength === 3) {
    changeDeepNestedField(value, section, field, setState, indexes, subFields)
    return
  }

  if (indexesLength === 2 && subfieldsLength === 2) {
    changeNestedField(value, section, field, setState, indexes, subFields)
    return
  }

  if (indexesLength === 1 && subfieldsLength === 1) {
    changeSubsectionField(value, section, field, setState, indexes, subFields)
    return
  }

  changeField(value, section, field, setState)
  return
}

export const changeHandler: Record<FieldType, FieldHandler> = {
  drop_down: (value, section, field, setState, indexes, subFields) => {
    const formattedVal = value?.id ?? null
    onFieldChange(formattedVal, section, field, setState, indexes, subFields)
  },
  text: (event, section, field, setState, indexes, subFields) => {
    const formattedVal = event.target.value
    onFieldChange(formattedVal, section, field, setState, indexes, subFields)
  },
  boolean: (value, section, field, setState, indexes, subFields) => {
    onFieldChange(value, section, field, setState, indexes, subFields)
  },
}

export const formatErrors = (errors: ErrorType, indexes?: number[]) => {
  const indexesLength = indexes?.length
  const [dataIndex, nestedDataIndex, deepNestedDataIndex] = indexes ?? []

  if (!Array.isArray(errors)) {
    return errors
  }

  if (errors.length > 0 && errors.every(Array.isArray)) {
    return indexesLength === 2
      ? errors[0][nestedDataIndex]
      : errors[0][nestedDataIndex]?.[deepNestedDataIndex]
  }

  return indexesLength === 2 ? errors[nestedDataIndex] : errors[dataIndex]
}

export const PCRSelectWidget = ({
  PCRData,
  setPCRData,
  sectionIdentifier,
  field,
  options,
  errors,
  indexes,
  subFields,
}: WidgetPprops & { options: OptionsType[] }) => {
  const value = getValue(PCRData, sectionIdentifier, field, indexes, subFields)
  const formattedValue = find(options, { id: value }) || null
  const formattedErrors = formatErrors(errors, indexes)

  return (
    <div>
      <Label>{pcrFieldsMapping[field]}</Label>
      <div className="flex items-center">
        <Field
          widget="autocomplete"
          options={options}
          value={formattedValue}
          onChange={(_, value) =>
            changeHandler['drop_down'](
              value,
              sectionIdentifier,
              field,
              setPCRData,
              indexes,
              subFields,
            )
          }
          getOptionLabel={(option) => getOptionLabel(options, option)}
          {...defaultProps}
          {...formatClassName('min-w-56 md:min-w-[370px]')}
          {...(additionalProperties[field] ?? {})}
        />
        <FieldErrorIndicator errors={formattedErrors} field={field} />
      </div>
    </div>
  )
}

export const PCRTextWidget = ({
  PCRData,
  setPCRData,
  sectionIdentifier,
  field,
  errors,
  indexes,
  subFields,
}: WidgetPprops) => {
  const value = getValue(PCRData, sectionIdentifier, field, indexes, subFields)
  const formattedErrors = formatErrors(errors, indexes)

  return (
    <div>
      <Label>{pcrFieldsMapping[field]}</Label>
      <div className="flex items-center">
        <SimpleInput
          id={field}
          value={value}
          type="text"
          onFocus={onTextareaFocus}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            changeHandler['text'](
              event,
              sectionIdentifier,
              field,
              setPCRData,
              indexes,
              subFields,
            )
          }
          {...defaultPropsSimpleField}
          containerClassName={
            defaultPropsSimpleField.containerClassName +
            ' !min-w-56 md:!min-w-[600px]'
          }
        />
        <FieldErrorIndicator errors={formattedErrors} field={field} />
      </div>
    </div>
  )
}

export const PCRTextAreaWidget = ({
  PCRData,
  setPCRData,
  sectionIdentifier,
  field,
  errors,
  indexes,
  subFields,
}: WidgetPprops) => {
  const value = getValue(PCRData, sectionIdentifier, field, indexes, subFields)
  const formattedErrors = formatErrors(errors, indexes)

  return (
    <div className="w-full md:w-auto">
      <Label>{pcrFieldsMapping[field]} (150-250 words)</Label>
      <div className="flex items-center">
        <TextareaAutosize
          value={value as string}
          onFocus={onTextareaFocus}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            changeHandler['text'](
              event,
              sectionIdentifier,
              field,
              setPCRData,
              indexes,
              subFields,
            )
          }
          className={cx(
            textAreaClassname,
            '!min-w-56 !pb-[5px] md:!min-w-[600px]',
          )}
          style={STYLE}
          minRows={7}
        />
        <FieldErrorIndicator errors={formattedErrors} field={field} />
      </div>
    </div>
  )
}

export const PCRBooleanWidget = ({
  PCRData,
  setPCRData,
  sectionIdentifier,
  field,
  errors,
  indexes,
  subFields,
}: WidgetPprops) => {
  const value = getValue(PCRData, sectionIdentifier, field, indexes, subFields)
  const formattedErrors = formatErrors(errors, indexes)

  return (
    <div>
      <Label>{pcrFieldsMapping[field]}</Label>
      <div className="flex items-center">
        <Checkbox
          className="pb-1 pl-2 pt-0"
          checked={Boolean(value)}
          onChange={(_, value) =>
            changeHandler['boolean'](
              value,
              sectionIdentifier,
              field,
              setPCRData,
              indexes,
              subFields,
            )
          }
          inputProps={{ tabIndex: 0 }}
          sx={{
            '&.Mui-focusVisible': {
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
            },
            color: 'black',
          }}
        />
        <FieldErrorIndicator errors={formattedErrors} field={field} />
      </div>
    </div>
  )
}

export const TabLabel = ({
  agency,
  field,
  errors,
}: {
  agency: ApiAgency
  field: string
  errors: Record<string, any>
}) => {
  const tabErrors = { [field]: map(errors[agency.id], 'errors') }

  return (
    <div className="relative flex items-center justify-between gap-x-2">
      <div className="leading-tight">{agency.name}</div>
      {hasSectionErrors(tabErrors) && <SectionErrorIndicator errors={[]} />}
    </div>
  )
}
