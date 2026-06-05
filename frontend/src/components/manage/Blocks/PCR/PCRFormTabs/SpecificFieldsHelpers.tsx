import { ChangeEvent } from 'react'
// import {  Dispatch, SetStateAction } from 'react'

import { pcrFieldsMapping } from '../constants'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import {
  FieldHandler,
  FieldType,
  OptionsType,
} from '../../ProjectsListing/interfaces'
import { Dispatch, SetStateAction } from 'react'

// import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
// import Field from '@ors/components/manage/Form/Field'
// import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
// import {
//   DateInput,
//   FormattedNumberInput,
// } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { STYLE } from '../../Replenishment/Inputs/constants'
// import { FieldErrorIndicator } from '../HelperComponents'
// import {
//   canEditField,
//   formatOptions,
//   isOtherOdsReplacement,
//   onTextareaFocus,
// } from '../utils'
// import {
//   ProjectSpecificFields,
//   FieldType,
//   FieldHandler,
//   OptionsType,
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

import { TextareaAutosize } from '@mui/material'
// import { Checkbox } from '@mui/material'
import cx from 'classnames'
// import dayjs from 'dayjs'
import {
  find,
  isNil,
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

const getValue = <T,>(
  fields: T,
  sectionIdentifier: keyof T,
  fieldName: string,
  subField?: string,
  index?: number,
  index2?: number,
  subField2?: string,
  index3?: number,
  subfield3?: string,
) => {
  const sectionData = fields[sectionIdentifier] as Record<string, any>
  const subSectionData = sectionData[subField as string] || []

  if (
    !isNil(index) &&
    !isNil(index2) &&
    !isNil(index3) &&
    subField2 &&
    subfield3
  ) {
    return sectionData?.[index]?.[subField2]?.[index2]?.[subfield3]?.[index3]?.[
      fieldName
    ]
  }

  if (!isNil(index) && !isNil(index2) && subField2) {
    return sectionData?.[index]?.[subField2]?.[index2]?.[fieldName]
  }

  return subField && !isNil(index)
    ? subSectionData?.[index]?.[fieldName]
    : !isNil(index)
      ? sectionData?.[index]?.[fieldName]
      : sectionData[fieldName]
}

// const getFieldDefaultProps = (
//   editableFields: string[],
//   field: ProjectSpecificFields,
// ) => {
//   const fieldName = field.write_field_name
//   const isOdp = field.table === 'ods_odp' && field.section !== 'Approval'

//   return {
//     ...{
//       ...defaultPropsSimpleField,
//       className: cx('!ml-0 h-10', defaultPropsSimpleField.className, {
//         'w-[125px]': isOdp,
//         [disabledClassName]: !canEditField(editableFields, fieldName),
//         '!flex-grow-0': field.data_type === 'date',
//         '!bg-mlfs-bannerColor': field.is_actual,
//       }),
//       containerClassName: cx(defaultPropsSimpleField.containerClassName, {
//         'w-[125px]': isOdp,
//       }),
//     },
//   }
// }

export const changeArrayField: FieldHandler = (
  value,
  field,
  setState,
  section,
  _,
  index,
) => {
  if (!isNil(index)) {
    setState((prevData: any) => {
      const sectionData = prevData[section] || []

      sectionData[index] = {
        ...sectionData[index],
        [field]: value,
      }

      return { ...prevData, [field]: sectionData }
    }, field)
  }
}

export const changeArrayField2: FieldHandler = (
  value,
  field,
  setState,
  section,
  _,
  index,
  index2,
  subfield2,
) => {
  if (!isNil(index) && !isNil(index2)) {
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
                          [field]: value,
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

export const changeArrayField3: FieldHandler = (
  value,
  field,
  setState,
  section,
  _,
  index,
  index2,
  subfield2,
  index3,
  subfield3,
) => {
  if (!isNil(index) && !isNil(index2) && !isNil(index3)) {
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
  subField,
  index,
  index2,
  subfield2,
  index3,
  subfield3,
) => {
  if (
    !isNil(index) &&
    !isNil(index2) &&
    subfield2 &&
    !isNil(index3) &&
    subfield3
  ) {
    changeArrayField3(
      value,
      field,
      setState,
      section,
      subField,
      index,
      index2,
      subfield2,
      index3,
      subfield3,
    )
    return
  }

  if (!isNil(index) && !isNil(index2) && subfield2) {
    changeArrayField2(
      value,
      field,
      setState,
      section,
      subField,
      index,
      index2,
      subfield2,
    )
    return
  }
  if (subField && !isNil(index)) {
    changeNestedField(value, field, setState, section, subField, index)
  } else if (!isNil(index)) {
    changeArrayField(value, field, setState, section, subField, index)
  } else {
    changeField(value, field, setState, section)
  }
}

export const changeHandler: Record<FieldType, FieldHandler> = {
  text: (
    value,
    field,
    setState,
    section,
    subField,
    index,
    index2,
    subfield2,
    index3,
    subfield3,
  ) => {
    const formattedVal = value.target.value
    onFieldChange(
      formattedVal,
      field,
      setState,
      section,
      subField,
      index,
      index2,
      subfield2,
      index3,
      subfield3,
    )
  },
  number: (
    value,
    field,
    setState,
    section,
    subField,
    index,
    index2,
    subfield2,
    index3,
    subfield3,
  ) => {
    const formattedVal = value.target.value

    if (formattedVal === '' || !isNaN(parseInt(formattedVal))) {
      const finalVal = formattedVal ? parseInt(formattedVal) : null
      onFieldChange(
        finalVal,
        field,
        setState,
        section,
        subField,
        index,
        index2,
        subfield2,
        index3,
        subfield3,
      )
    } else {
      value.preventDefault()
    }
  },
  decimal: (
    value,
    field,
    setState,
    section,
    subField,
    index,
    index2,
    subfield2,
    index3,
    subfield3,
  ) => {
    const val = value.target.value
    const formattedVal = val === '' ? null : val

    if (!isNaN(Number(formattedVal))) {
      onFieldChange(
        formattedVal,
        field,
        setState,
        section,
        subField,
        index,
        index2,
        subfield2,
        index3,
        subfield3,
      )
    } else {
      value.preventDefault()
    }
  },
  drop_down: (
    value,
    field,
    setState,
    section,
    subField,
    index,
    index2,
    subfield2,
    index3,
    subfield3,
  ) => {
    const formattedVal = value?.id ?? null
    onFieldChange(
      formattedVal,
      field,
      setState,
      section,
      subField,
      index,
      index2,
      subfield2,
      index3,
      subfield3,
    )
  },
  boolean: (
    value,
    field,
    setState,
    section,
    subField,
    index,
    index2,
    subfield2,
    index3,
    subfield3,
  ) => {
    onFieldChange(
      value,
      field,
      setState,
      section,
      subField,
      index,
      index2,
      subfield2,
      index3,
      subfield3,
    )
  },
  date: (
    value,
    field,
    setState,
    section,
    subField,
    index,
    index2,
    subfield2,
    index3,
    subfield3,
  ) => {
    const formattedVal = value.target.value || null
    onFieldChange(
      formattedVal,
      field,
      setState,
      section,
      subField,
      index,
      index2,
      subfield2,
      index3,
      subfield3,
    )
  },
}

const additionalProperties: Record<string, Record<string, unknown>> = {
  rating: formatClassName('w-full min-w-56 md:min-w-64'),
  completion_report_done_by: formatClassName('w-full min-w-56 md:min-w-72'),
}

export const AutocompleteWidget = <T, W>(
  data: T,
  setData: Dispatch<SetStateAction<T>>,
  sectionIdentifier: keyof T,
  field: string,
  options: OptionsType[],
  errors: { [key: string]: string[] } | { [key: string]: string[] }[],
  index?: number,
  subField?: string,
  index2?: number,
  subfield2?: string,
  index3?: number,
  subfield3?: string,
) => {
  const value = getValue(
    data,
    sectionIdentifier,
    field,
    subField,
    index,
    index2,
    subfield2,
    index3,
    subfield3,
  )

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
              subField,
              index,
              index2,
              subfield2,
              index3,
              subfield3,
            )
          }
          getOptionLabel={(option) => getOptionLabel(options, option)}
          {...defaultProps}
          {...(additionalProperties[field] ?? {})}
        />
        <FieldErrorIndicator
          errors={
            !isNil(index)
              ? (errors as { [key: string]: string[] }[])[index]
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
  index?: number,
  subField?: string,
  index2?: number,
  subField2?: string,
  index3?: number,
  subfield3?: string,
) => {
  const value = getValue(
    data,
    sectionIdentifier,
    field,
    subField,
    index,
    index2,
    subField2,
    index3,
    subfield3,
  )

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
              subField,
              index,
              index2,
              subField2,
              index3,
              subfield3,
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
            !isNil(index)
              ? (errors as { [key: string]: string[] }[])[index]
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

// const NumberWidget = <T,>(
//   fields: T,
//   setFields: Dispatch<SetStateAction<T>>,
//   field: ProjectSpecificFields,
//   errors: { [key: string]: string[] } | { [key: string]: string[] }[],
//   editableFields: string[],
//   sectionIdentifier: keyof T = identifier as keyof T,
//   subField?: string,
//   index?: number,
// ) => {
//   const isApprovalOdp =
//     field.section === 'Approval' && field.table === 'ods_odp'

//   const fieldName = field.write_field_name

//   const fieldForValue =
//     isApprovalOdp && isUndefined(fields[sectionIdentifier][fieldName])
//       ? `computed_${fieldName}`
//       : fieldName
//   const value = getValue(
//     fields,
//     sectionIdentifier,
//     fieldForValue,
//     subField,
//     index,
//   )

//   const isDisabledImpactField =
//     field.section === 'Impact' && !canEditField(editableFields, fieldName)
//   const isActualImpactField = field.section === 'Impact' && field.is_actual

//   return (
//     <div
//       className={cx('flex h-full flex-col', {
//         'justify-between':
//           (field.table !== 'ods_odp' && field.section !== 'Header') ||
//           field.section === 'Approval',
//       })}
//     >
//       <Label
//         className={cx({
//           italic: isDisabledImpactField,
//           '!font-medium': isActualImpactField,
//         })}
//       >
//         {field.label}
//         {getFieldExtraLabel(isDisabledImpactField, field.label)}
//       </Label>
//       <div className="flex items-center">
//         <FormattedNumberInput
//           id={fieldName}
//           value={value ?? ''}
//           withoutDefaultValue={true}
//           decimalDigits={field.data_type === 'number' ? 0 : 2}
//           disabled={!canEditField(editableFields, fieldName)}
//           onChange={(value) =>
//             changeHandler[field.data_type]<T, SpecificFields>(
//               value,
//               fieldName,
//               setFields,
//               sectionIdentifier,
//               subField,
//               index,
//             )
//           }
//           {...omit(
//             getFieldDefaultProps(editableFields, field),
//             'containerClassName',
//           )}
//         />
//         <div
//           className={cx({
//             'w-8': field.section === 'Approval' && field.table === 'ods_odp',
//           })}
//         >
//           <FieldErrorIndicator
//             errors={
//               !isNil(index)
//                 ? (errors as { [key: string]: string[] }[])[index]
//                 : errors
//             }
//             field={field.label}
//           />
//         </div>
//       </div>
//     </div>
//   )
// }

// const BooleanWidget = <T,>(
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

//   const isDisabledImpactField =
//     field.section === 'Impact' && !canEditField(editableFields, fieldName)
//   const isActualImpactField = field.section === 'Impact' && field.is_actual

//   return (
//     <div className="col-span-full flex w-full">
//       <Label
//         className={cx({
//           italic: isDisabledImpactField,
//           '!font-medium': isActualImpactField,
//         })}
//       >
//         {field.label}
//         {getFieldExtraLabel(isDisabledImpactField, field.label)}
//       </Label>
//       <div className="flex items-center">
//         <Checkbox
//           className="pb-1 pl-2 pt-0"
//           checked={Boolean(value)}
//           disabled={!canEditField(editableFields, fieldName)}
//           onChange={(_: React.SyntheticEvent, value) =>
//             changeHandler[field.data_type]<T, SpecificFields>(
//               value,
//               fieldName,
//               setFields,
//               sectionIdentifier,
//               subField,
//               index,
//             )
//           }
//           inputProps={{ tabIndex: 0 }}
//           sx={{
//             '&.Mui-focusVisible': {
//               backgroundColor: 'rgba(0, 0, 0, 0.03)',
//             },
//             color: 'black',
//           }}
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

// const DateWidget = <T,>(
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
//     <div>
//       <Label>{field.label}</Label>
//       <div className="flex items-center">
//         <div className="w-40">
//           <DateInput
//             id={fieldName}
//             value={value}
//             disabled={!canEditField(editableFields, fieldName)}
//             formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
//             onChange={(value) => {
//               changeHandler[field.data_type]<T, SpecificFields>(
//                 value,
//                 fieldName,
//                 setFields,
//                 sectionIdentifier,
//                 subField,
//                 index,
//               )

//               if (fieldName === 'date_completion') {
//                 changeHandler[field.data_type]<T, SpecificFields>(
//                   value,
//                   'project_end_date' as keyof SpecificFields,
//                   setFields,
//                   'crossCuttingFields' as keyof T,
//                   subField,
//                   index,
//                 )
//               }
//             }}
//             {...omit(getFieldDefaultProps(editableFields, field), [
//               'containerClassName',
//             ])}
//           />
//         </div>
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
// } */
}

export const widgets = {
  drop_down: AutocompleteWidget,
  text_area: TextAreaWidget,
  // simpleText: TextWidget,
  // number: NumberWidget,
  // decimal: NumberWidget,
  // boolean: BooleanWidget,
  // date: DateWidget,
}
