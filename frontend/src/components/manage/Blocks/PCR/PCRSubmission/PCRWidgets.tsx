import { ChangeEvent } from 'react'

import { FieldErrorIndicator } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { textAreaClassname } from '@ors/components/manage/Blocks/ProjectsListing/constants'
import { onTextareaFocus } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { STYLE } from '@ors/components/manage/Blocks/Replenishment/Inputs/constants'
import { PCRData, WidgetPprops, FieldType, FieldHandler } from '../interfaces'
import { pcrFieldsMapping } from '../constants'

import { TextareaAutosize } from '@mui/material'
import { isNil } from 'lodash'
import cx from 'classnames'

const getValue = (
  PCRData: PCRData,
  sectionIdentifier: keyof PCRData,
  field: string,
  indexes?: number[],
  subFields?: string[],
) => {
  const [index1] = indexes ?? []
  const sectionData = PCRData[sectionIdentifier] as Record<string, any>

  return sectionData[index1][field]
}

export const changeArrayField: FieldHandler = (
  value,
  section,
  field,
  setState,
  indexes,
) => {
  const [index1] = indexes ?? []

  if (!isNil(index1)) {
    setState((prevData) => {
      const sectionData = prevData[section] || []

      sectionData[index1] = { ...sectionData[index1], [field]: value }

      return { ...prevData, [field]: sectionData }
    }, field)
  }
}

export const onFieldChange: FieldHandler = (
  value,
  section,
  field,
  setState,
  indexes,
  subFields,
) => {
  changeArrayField(value, section, field, setState, indexes)
  return
}

export const changeHandler: Record<FieldType, FieldHandler> = {
  text: (event, section, field, setState, indexes, subFields) => {
    const formattedVal = event.target.value
    onFieldChange(formattedVal, section, field, setState, indexes, subFields)
  },
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
            changeHandler['text']<T>(
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
            '!min-w-56 !pb-[5px] md:!min-w-[500px]',
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
