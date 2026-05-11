import { ChangeEvent, useContext } from 'react'

import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { FormattedNumberInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import { FieldErrorIndicator, SubmitButton } from '../../HelperComponents'
import { EnterpriseNumberField } from '../FormHelperComponents'
import { getFieldDefaultProps } from '../utils'
import { defaultProps } from '../../constants'
import { onTextareaFocus } from '../../utils'
import {
  enterpriseFieldsMapping,
  initialSubstanceDetailsFields,
  substanceDecimalFields,
  substanceFields,
} from '../constants'
import {
  EnterpriseSubstanceDetails,
  EnterpriseDataProps,
  OptionsType,
} from '../../interfaces'

import { find, get, isObject, map, omit, sortBy, split } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import { Divider } from '@mui/material'
import cx from 'classnames'

const EnterpriseSubstanceDetailsSection = ({
  enterpriseData,
  setEnterpriseData,
  errors,
  odsOdpErrors,
}: EnterpriseDataProps & {
  odsOdpErrors: { [key: string]: string[] }[]
}) => {
  const { substances, blends } = useContext(ProjectsDataContext)

  const sectionIdentifier = 'substance_fields'
  const sectionId = 'substance_details'
  const substanceData = enterpriseData[sectionId] || []

  const substancesOptions = map(sortBy(substances, 'name'), (substance) => ({
    ...substance,
    id: 'substance_' + substance.id,
    label: substance.name,
    is_substance: true,
  }))
  const blendOptions = map(sortBy(blends, 'name'), (blend) => ({
    ...blend,
    id: 'blend_' + blend.id,
    label: blend.name + ' (' + blend.composition + ')',
    is_substance: false,
  }))
  const options = [...substancesOptions, ...blendOptions]

  const handleChangeDropdownValues = (value: any, index: number) => {
    const [fieldName = '', fieldValue] = split(value?.id ?? '', '_')
    const finalValue = parseInt(fieldValue) ?? null

    setEnterpriseData((prevData) => {
      const sectionData = prevData[sectionId] || []
      const updatedData = [...sectionData]

      updatedData[index] = {
        ...updatedData[index],
        ods_substance: fieldName === 'substance' ? finalValue : null,
        ods_blend: fieldName === 'blend' ? finalValue : null,
      }
      return {
        ...prevData,
        [sectionId]: updatedData,
      }
    }, 'substance')
  }

  const handleChangeTextValues = (
    event: ChangeEvent<HTMLInputElement>,
    field: string,
    index: number,
  ) => {
    const value = event.target.value

    setEnterpriseData((prevData) => {
      const sectionData = prevData[sectionId] || []
      const updatedData = [...sectionData]

      updatedData[index] = {
        ...updatedData[index],
        [field]: value,
      }
      return {
        ...prevData,
        [sectionId]: updatedData,
      }
    }, field)
  }

  const handleChangeNumericValues = (
    event: ChangeEvent<HTMLInputElement>,
    field: string,
    index: number,
  ) => {
    const initialValue = event.target.value
    const value = initialValue === '' ? null : initialValue

    if (!isNaN(Number(value))) {
      const splitValue = value?.split('.')
      const decimalPart = splitValue?.[1]

      if (decimalPart && decimalPart.length > 10) {
        return
      }

      setEnterpriseData((prevData) => {
        const sectionData = prevData[sectionId] || []
        const updatedData = [...sectionData]

        updatedData[index] = {
          ...updatedData[index],
          [field]: value,
        }
        return {
          ...prevData,
          [sectionId]: updatedData,
        }
      }, field)
    } else {
      event.preventDefault()
    }
  }

  const onAddSubstance = () => {
    setEnterpriseData((prevData) => {
      const sectionData = prevData[sectionId] || []

      return {
        ...prevData,
        [sectionId]: [...sectionData, initialSubstanceDetailsFields],
      }
    }, 'add-substance')
  }

  const onRemoveSubstance = (index: number) => {
    setEnterpriseData((prevData) => {
      const sectionData = prevData[sectionId] || []

      return {
        ...prevData,
        [sectionId]: sectionData.filter((_, idx) => idx !== index),
      }
    }, 'remove-substance')
  }

  const getSubstanceValue = (substance: EnterpriseSubstanceDetails) =>
    substance.ods_substance
      ? `substance_${substance.ods_substance}`
      : substance.ods_blend
        ? `blend_${substance.ods_blend}`
        : null

  return (
    <>
      <div className="flex flex-wrap gap-x-20 gap-y-2">
        {map(substanceDecimalFields, (field, index) => (
          <EnterpriseNumberField
            key={index}
            dataType="decimal"
            {...{
              enterpriseData,
              setEnterpriseData,
              field,
              sectionIdentifier,
              errors,
            }}
          />
        ))}
      </div>

      <Divider className="my-6" />

      <div className="flex flex-col flex-wrap gap-y-2">
        {substanceData.map((substance, dataIndex) => (
          <span key={dataIndex} className="flex flex-col flex-wrap gap-y-4">
            <div className="align-center flex flex-row flex-wrap gap-x-7 gap-y-2">
              <>
                <div>
                  <Label>{enterpriseFieldsMapping.ods_substance}</Label>
                  <div className="flex items-center">
                    <Field
                      widget="autocomplete"
                      options={options}
                      value={getSubstanceValue(substance)}
                      onChange={(_, value) =>
                        handleChangeDropdownValues(value, dataIndex)
                      }
                      getOptionLabel={(option: any) =>
                        (isObject(option)
                          ? get(option, 'label')
                          : (find(options, { id: option }) as OptionsType)
                              ?.label) || ''
                      }
                      {...defaultProps}
                      FieldProps={{
                        className:
                          defaultProps.FieldProps.className +
                          ' w-full min-w-64',
                      }}
                    />
                    <FieldErrorIndicator
                      field={
                        substance.ods_blend ? 'ods_blend' : 'ods_substance'
                      }
                      errors={odsOdpErrors[dataIndex]}
                    />
                  </div>
                </div>
                {map(substanceFields, (field, index) =>
                  field !== 'selected_alternative' ? (
                    <div key={index}>
                      <Label>{enterpriseFieldsMapping[field]}</Label>
                      <div className="flex items-center">
                        <FormattedNumberInput
                          id={field}
                          withoutDefaultValue={true}
                          value={
                            (substance[
                              field as keyof EnterpriseSubstanceDetails
                            ] as string) ?? ''
                          }
                          onChange={(event) =>
                            handleChangeNumericValues(event, field, dataIndex)
                          }
                          {...omit(
                            getFieldDefaultProps(),
                            'containerClassName',
                          )}
                        />
                        <FieldErrorIndicator
                          {...{ field }}
                          errors={odsOdpErrors[dataIndex]}
                        />
                      </div>
                    </div>
                  ) : (
                    <div key={index}>
                      <Label>{enterpriseFieldsMapping[field]}</Label>
                      <div className="flex items-center">
                        <SimpleInput
                          id={field}
                          value={
                            (substance[
                              field as keyof EnterpriseSubstanceDetails
                            ] as string) ?? ''
                          }
                          onFocus={onTextareaFocus}
                          onChange={(event) =>
                            handleChangeTextValues(event, field, dataIndex)
                          }
                          type="text"
                          {...getFieldDefaultProps()}
                        />
                        <FieldErrorIndicator
                          {...{ field }}
                          errors={odsOdpErrors[dataIndex]}
                        />
                      </div>
                    </div>
                  ),
                )}
              </>
              <IoTrash
                className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
                size={16}
                onClick={() => {
                  onRemoveSubstance(dataIndex)
                }}
              />
            </div>
            {dataIndex !== substanceData.length - 1 && <Divider />}
          </span>
        ))}
      </div>
      <SubmitButton
        title="Add substance"
        onSubmit={onAddSubstance}
        className={cx('h-8', { 'mt-6': substanceData.length > 0 })}
      />
    </>
  )
}

export default EnterpriseSubstanceDetailsSection
