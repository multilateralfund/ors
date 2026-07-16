import { ChangeEvent } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { getOptionLabel } from '@ors/components/manage/Blocks/BusinessPlans/BPEdit/editSchemaHelpers'
import { FieldErrorIndicator } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { onTextareaFocus } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { STYLE } from '@ors/components/manage/Blocks/Replenishment/Inputs/constants'
import {
  defaultProps,
  formatClassName,
  textAreaClassname,
} from '@ors/components/manage/Blocks/ProjectsListing/constants'
import { pcrFieldsMapping } from '../constants'
import {
  PCRData,
  WidgetPprops,
  FieldType,
  FieldHandler,
  OptionsType,
} from '../interfaces'

import { TextareaAutosize } from '@mui/material'
import { find, isNil } from 'lodash'
import cx from 'classnames'

// to update
const additionalProperties: Record<string, Record<string, unknown>> = {
  rating: formatClassName('w-full min-w-56 md:min-w-64'),
  completion_report_done_by: formatClassName('w-full min-w-56 md:min-w-72'),
}

const getValue = (
  PCRData: PCRData,
  sectionIdentifier: keyof PCRData,
  field: string,
  indexes?: number[],
  subFields?: string[],
) => {
  const [dataIndex, nestedDataIndex, deepNestedDataIndex] = indexes ?? []
  const [_, nestedField, deepNestedField] = subFields ?? []

  const indexesLength = indexes?.length
  const subfieldsLength = subFields?.length

  const sectionData = PCRData[sectionIdentifier] as Record<string, any>

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

  return sectionData[dataIndex][field]
}

export const changeArrayField: FieldHandler = (
  value,
  section,
  field,
  setState,
  indexes,
) => {
  const [dataIndex] = indexes ?? []

  if (!isNil(dataIndex)) {
    setState((prevData) => {
      const sectionData = prevData[section] || []

      sectionData[dataIndex] = { ...sectionData[dataIndex], [field]: value }

      return { ...prevData, [section]: sectionData }
    }, field)
  }
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

export const onFieldChange: FieldHandler = (
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

  changeArrayField(value, section, field, setState, indexes)
  return
}

export const changeHandler: Record<FieldType, FieldHandler> = {
  text: (event, section, field, setState, indexes, subFields) => {
    const formattedVal = event.target.value
    onFieldChange(formattedVal, section, field, setState, indexes, subFields)
  },
  drop_down: (value, section, field, setState, indexes, subFields) => {
    const formattedVal = value?.id ?? null
    onFieldChange(formattedVal, section, field, setState, indexes, subFields)
  },
}

export const PCRSelectWidget = <T,>({
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
        <FieldErrorIndicator
          errors={
            !isNil(indexes?.[0])
              ? (errors as { [key: string]: string[] }[])[indexes?.[0]]
              : errors
          }
          field={field}
        />
      </div>
    </div>
  )
}

export const PCRTextAreaWidget = <T,>({
  PCRData,
  setPCRData,
  sectionIdentifier,
  field,
  errors,
  indexes,
  subFields,
}: WidgetPprops) => {
  const value = getValue(PCRData, sectionIdentifier, field, indexes, subFields)

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
        <FieldErrorIndicator
          errors={
            !isNil(indexes?.[0])
              ? (errors as { [key: string]: string[] }[])[indexes?.[0]]
              : errors
          }
          field={field}
        />
      </div>
    </div>
  )
}
