import { ChangeEvent, Dispatch, SetStateAction } from 'react'

import { pcrFieldsMapping } from '../constants'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { FieldType, OptionsType } from '../../ProjectsListing/interfaces'

// import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import {
  DateInput,
  FormattedNumberInput,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { STYLE } from '../../Replenishment/Inputs/constants'
// import {
//   canEditField,
//   formatOptions,
//   isOtherOdsReplacement,
//   onTextareaFocus,
// } from '../utils'
// import {
//   ProjectSpecificFields,
//   FieldHandler,
//   SpecificFields,
// } from '../interfaces'
// import {
//   defaultProps,
//   defaultPropsSimpleField,
//   textAreaClassname,
//   additionalProperties,
//   disabledClassName,
//   textFieldClassName,
//   approvalToOdsMap,
// } from '../constants'

import { Checkbox, TextareaAutosize } from '@mui/material'
import cx from 'classnames'
import dayjs from 'dayjs'
import {
  find,
  isNil,
  omit,
  //   get,
  //   isObject,
  //   isBoolean,
  // isNil,
  //   omit,
  //   isUndefined,
  //   lowerFirst,
} from 'lodash'
import {
  defaultProps,
  defaultPropsSimpleField,
  formatClassName,
  textAreaClassname,
} from '../../ProjectsListing/constants'
import { FieldErrorIndicator } from '../../ProjectsListing/HelperComponents'
import { getOptionLabel } from '../../BusinessPlans/BPEdit/editSchemaHelpers'
import { onTextareaFocus } from '../../ProjectsListing/utils'
import {
  changeField,
  changeNestedField,
} from '../../ProjectsListing/ProjectsCreate/SpecificFieldsHelpers'
import { FieldHandler } from '../interfaces'

const getValue = <T,>(
  fields: T,
  sectionIdentifier: keyof T,
  fieldName: string,
  subFields?: string[],
  indexes?: number[],
) => {
  const [index, index2, index3] = indexes ?? []
  const [subField, subField2, subfield3] = subFields ?? []

  const indexesLength = indexes?.length
  const subfieldsLength = subFields?.length

  const sectionData = fields[sectionIdentifier] as Record<string, any>
  const subSectionData = sectionData[subField as string] || []

  if (indexesLength === 3 && subfieldsLength === 3) {
    return sectionData[index][subField2][index2][subfield3][index3][fieldName]
  }

  if (indexesLength === 2 && subfieldsLength === 2) {
    return sectionData[index][subField2][index2][fieldName]
  }

  return indexesLength === 1 && subfieldsLength === 1
    ? subSectionData[index][fieldName]
    : indexes && indexes.length === 1
      ? sectionData[index][fieldName]
      : sectionData[fieldName]
}

const getFieldDefaultProps = (fieldName: string) => {
  return {
    ...{
      ...defaultPropsSimpleField,
      className: cx('!ml-0 h-10', defaultPropsSimpleField.className, {
        // 'w-[125px]': isOdp,
        // '!flex-grow-0': field.data_type === 'date',
      }),
    },
  }
}

export const changeArrayField: FieldHandler = (
  value,
  field,
  setState,
  section,
  index,
) => {
  if (!isNil(index)) {
    setState((prevData: any) => {
      const sectionData = prevData[section] || []

      sectionData[index] = { ...sectionData[index], [field]: value }

      return { ...prevData, [field]: sectionData }
    }, field)
  }
}

export const changeArrayField2: FieldHandler = (
  value,
  field,
  setState,
  section,
  subfield2,
  indexes,
) => {
  console.log(subfield2)
  const [index, index2] = indexes ?? []

  if (indexes?.length === 2) {
    setState((prevData: any) => {
      const sectionData = prevData[section] || []

      return {
        ...prevData,
        [section]: sectionData.map((agency, agencyIndex) =>
          agencyIndex === index
            ? {
                ...agency,
                [subfield2]: agency[subfield2]?.map(
                  (projectElement: any, peIndex: number) =>
                    peIndex === index2
                      ? { ...projectElement, [field]: value }
                      : projectElement,
                ),
              }
            : agency,
        ),
      }
    }, field)
  }
}

export const changeArrayField3: FieldHandler = (
  value,
  field,
  setState,
  section,
  subFields,
  indexes,
) => {
  const indexesLength = indexes?.length

  const [index, index2, index3] = indexes ?? []
  const [_, subfield2, subfield3] = subFields ?? []

  if (indexesLength === 3) {
    setState((prevData: any) => {
      const sectionData = prevData[section] || []

      return {
        ...prevData,
        [section]: sectionData.map((agency, agencyIndex) =>
          agencyIndex === index
            ? {
                ...agency,
                [subfield2]: agency[subfield2]?.map(
                  (projectElement: any, peIndex: number) =>
                    peIndex === index2
                      ? {
                          ...projectElement,
                          [subfield3]: projectElement[subfield3]?.map(
                            (cause_of_delay: any, cdIndex: number) =>
                              cdIndex === index3
                                ? {
                                    ...cause_of_delay,
                                    [field]: value,
                                  }
                                : cause_of_delay,
                          ),
                        }
                      : projectElement,
                ),
              }
            : agency,
        ),
      }
    }, field)
  }
}

const onFieldChange: FieldHandler = (
  value,
  field,
  setState,
  section,
  subFields,
  indexes,
) => {
  const [index] = indexes ?? []
  const [subField, subField2] = subFields ?? []

  const indexesLength = indexes?.length
  const subfieldsLength = subFields?.length

  if (indexesLength === 3 && subfieldsLength === 3) {
    changeArrayField3(value, field, setState, section, subFields, indexes)
    return
  }

  if (indexesLength === 2 && subfieldsLength === 2) {
    changeArrayField2(value, field, setState, section, subField2, indexes)
    return
  }
  if (indexesLength === 1 && subfieldsLength === 1) {
    changeNestedField(value, field, setState, section, subField, indexes)
    return
  } else if (indexesLength === 1) {
    changeArrayField(value, field, setState, section, index)
    return
  } else {
    changeField(value, field, setState, section)
    return
  }
}

export const changeHandler: Record<FieldType, FieldHandler> = {
  text: (value, field, setState, section, subFields, indexes) => {
    const formattedVal = value.target.value
    onFieldChange(formattedVal, field, setState, section, subFields, indexes)
  },
  number: (value, field, setState, section, subFields, indexes) => {
    const formattedVal = value.target.value

    if (formattedVal === '' || !isNaN(parseInt(formattedVal))) {
      const finalVal = formattedVal ? parseInt(formattedVal) : null
      onFieldChange(finalVal, field, setState, section, subFields, indexes)
    } else {
      value.preventDefault()
    }
  },
  decimal: (value, field, setState, section, subFields, indexes) => {
    const val = value.target.value
    const formattedVal = val === '' ? null : val

    if (!isNaN(Number(formattedVal))) {
      onFieldChange(formattedVal, field, setState, section, subFields, indexes)
    } else {
      value.preventDefault()
    }
  },
  drop_down: (value, field, setState, section, subFields, indexes) => {
    const formattedVal = value?.id ?? null
    onFieldChange(formattedVal, field, setState, section, subFields, indexes)
  },
  boolean: (value, field, setState, section, subFields, indexes) => {
    onFieldChange(value, field, setState, section, subFields, indexes)
  },
  date: (value, field, setState, section, subFields, indexes) => {
    const formattedVal = value.target.value || null
    onFieldChange(formattedVal, field, setState, section, subFields, indexes)
  },
}

const additionalProperties: Record<string, Record<string, unknown>> = {
  rating: formatClassName('w-full min-w-56 md:min-w-64'),
  completion_report_done_by: formatClassName('w-full min-w-56 md:min-w-72'),
  lesson_learned_id: {
    groupBy: (option: OptionsType & { category?: string }) => option.category,
  },
}

export const AutocompleteWidget = <T, W>(
  data: T,
  setData: Dispatch<SetStateAction<T>>,
  sectionIdentifier: keyof T,
  field: string,
  options: OptionsType[],
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  indexes?: number[],
  subFields?: string[],
) => {
  const value = getValue(data, sectionIdentifier, field, subFields, indexes)

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
            changeHandler['drop_down']<T, W>(
              value,
              field as keyof W,
              setData,
              sectionIdentifier,
              subFields,
              indexes,
            )
          }
          getOptionLabel={(option) => getOptionLabel(options, option)}
          {...defaultProps}
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

const NumberWidget = <T, W>(
  data: T,
  setData: Dispatch<SetStateAction<T>>,
  sectionIdentifier: keyof T,
  field: string,
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  isDecimal: boolean,
  indexes?: number[],
  subFields?: string[],
) => {
  const value = getValue(data, sectionIdentifier, field, subFields, indexes)
  const fieldType = isDecimal ? 'decimal' : 'number'

  return (
    <div>
      <Label>{pcrFieldsMapping[field]}</Label>
      <div className="flex items-center">
        <FormattedNumberInput
          id={field}
          value={value ?? ''}
          withoutDefaultValue={true}
          decimalDigits={fieldType === 'number' ? 0 : 2}
          onChange={(value) =>
            changeHandler[fieldType]<T, W>(
              value,
              field as keyof W,
              setData,
              sectionIdentifier,
              subFields,
              indexes,
            )
          }
          {...omit(getFieldDefaultProps(field), 'containerClassName')}
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

export const TextAreaWidget = <T, W>(
  data: T,
  setData: Dispatch<SetStateAction<T>>,
  sectionIdentifier: keyof T,
  field: string,
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  indexes?: number[],
  subFields?: string[],
) => {
  const value = getValue(data, sectionIdentifier, field, subFields, indexes)

  return (
    <div className="w-full md:w-auto">
      <Label>{pcrFieldsMapping[field]} (150-250 words)</Label>
      <div className="flex items-center">
        <TextareaAutosize
          value={value as string}
          onFocus={onTextareaFocus}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            changeHandler['text']<T, W>(
              event,
              field as keyof W,
              setData,
              sectionIdentifier,
              subFields,
              indexes,
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

const DateWidget = <T, W>(
  data: T,
  setData: Dispatch<SetStateAction<T>>,
  sectionIdentifier: keyof T,
  field: string,
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  indexes?: number[],
  subFields?: string[],
) => {
  const value = getValue(data, sectionIdentifier, field, subFields, indexes)

  return (
    <div>
      <Label>{pcrFieldsMapping[field]}</Label>
      <div className="flex items-center">
        <div className="w-40">
          <DateInput
            id={field}
            value={value}
            formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
            onChange={(value) =>
              changeHandler['date']<T, W>(
                value,
                field as keyof W,
                setData,
                sectionIdentifier,
                subFields,
                indexes,
              )
            }
            {...omit(getFieldDefaultProps(field), 'containerClassName')}
          />
        </div>
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

const BooleanWidget = <T, W>(
  data: T,
  setData: Dispatch<SetStateAction<T>>,
  sectionIdentifier: keyof T,
  field: string,
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  indexes?: number[],
  subFields?: string[],
) => {
  const value = getValue(data, sectionIdentifier, field, subFields, indexes)

  return (
    <div>
      <Label>{pcrFieldsMapping[field]}</Label>
      <div className="flex items-center">
        <Checkbox
          className="pb-1 pl-2 pt-0"
          checked={Boolean(value)}
          onChange={(_, value) =>
            changeHandler['boolean']<T, W>(
              value,
              field as keyof W,
              setData,
              sectionIdentifier,
              subFields,
              indexes,
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

{
  /* // export const TextWidget = <T,>(
//   fields: T,
//   setFields: Dispatch<SetStateAction<T>>,
//   field: ProjectSpecificFields,
//   errors: { [key: string]: string[] } | { [key: string]: string[] }[],
//   editableFields: string[],
//   sectionIdentifier: keyof T = identifier as keyof T,
//   subField?: string,
//   index?: number,
// ) => {
//   const fieldName = field.write_field_name
//   const value = getValue(fields, sectionIdentifier, fieldName, subField, index)

//   return (
//     <div
//       className={cx({
//         'w-full': fieldName === 'programme_officer',
//       })}
//     >
//       <Label>{field.label}</Label>
//       <div className="flex items-center">
//         <SimpleInput
//           id={fieldName}
//           value={value}
//           type="text"
//           disabled={!canEditField(editableFields, fieldName)}
//           onFocus={onTextareaFocus}
//           onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
//             changeHandler[field.data_type]<T, SpecificFields>(
//               event,
//               fieldName,
//               setFields,
//               sectionIdentifier,
//               subField,
//               index,
//             )
//           }
//           {...getFieldDefaultProps(editableFields, field)}
//           containerClassName={
//             defaultPropsSimpleField.containerClassName +
//             (fieldName === 'programme_officer'
//               ? textFieldClassName + ' max-w-[370px]'
//               : '')
//           }
//         />
//         <FieldErrorIndicator
//           errors={
//             !isNil(index)
//               ? (errors as { [key: string]: string[] }[])[index]
//               : errors
//           }
//           field={field.label}
//         />
//       </div>
//     </div>
//   )
// }
 */
}

export const widgets = {
  drop_down: AutocompleteWidget,
  text_area: TextAreaWidget,
  // simpleText: TextWidget,
  number: NumberWidget,
  boolean: BooleanWidget,
  date: DateWidget,
}
