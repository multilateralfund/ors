import { ChangeEvent, useContext } from 'react'

import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { FormattedNumberInput } from '../../../Replenishment/Inputs'
import { FieldErrorIndicator, SubmitButton } from '../../HelperComponents'
import { EnterpriseNumberField } from '../FormHelperComponents'
import { onTextareaFocus } from '../../utils'
import {
  enterpriseFieldsMapping,
  initialSubstanceDetailsFields,
  substanceDecimalFields,
  substanceFields,
} from '../constants'
import {
  EnterpriseSubstanceDetails,
  PEnterpriseDataProps,
  OptionsType,
  PEnterpriseData,
  EnterpriseSubstanceFields,
} from '../../interfaces'
import {
  defaultProps,
  defaultPropsSimpleField,
  disabledClassName,
} from '../../constants'

import { find, get, isObject, map, sortBy, split } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import { Divider } from '@mui/material'
import cx from 'classnames'

const PEnterpriseSubstanceDetailsSection = ({
  enterpriseData,
  setEnterpriseData,
  errors,
  odsOdpErrors,
}: PEnterpriseDataProps & {
  odsOdpErrors: { [key: string]: string[] }[]
}) => {
  const { substances, blends } = useContext(ProjectsDataContext)
  const { canEditProjectEnterprise } = useContext(PermissionsContext)
  const isDisabled = !canEditProjectEnterprise

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

  const getFieldDefaultProps = (isFieldDisabled: boolean) => ({
    ...defaultPropsSimpleField,
    className: cx(defaultPropsSimpleField.className, '!m-0 h-10 !py-1', {
      [disabledClassName]: isFieldDisabled,
    }),
  })

  return (
    <>
      <div className="flex flex-wrap gap-x-20 gap-y-2">
        {map(substanceDecimalFields, (field) => (
          <EnterpriseNumberField<PEnterpriseData, EnterpriseSubstanceFields>
            dataType="decimal"
            enterpriseData={enterpriseData.substance_fields}
            {...{
              setEnterpriseData,
              sectionIdentifier,
              field,
              isDisabled,
              errors,
            }}
          />
        ))}
      </div>

      <Divider className="my-6" />

      <div className="flex flex-col flex-wrap gap-y-2">
        {substanceData.map((substance, index) => (
          <>
            <div className="align-center flex flex-row flex-wrap gap-x-7 gap-y-2">
              <>
                <div>
                  <Label>{enterpriseFieldsMapping.ods_substance}</Label>
                  <div className="flex items-center">
                    <Field
                      widget="autocomplete"
                      options={options}
                      disabled={isDisabled}
                      value={getSubstanceValue(substance)}
                      onChange={(_, value) =>
                        handleChangeDropdownValues(value, index)
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
                      errors={odsOdpErrors[index]}
                    />
                  </div>
                </div>
                {map(substanceFields, (field) =>
                  field !== 'selected_alternative' ? (
                    <div>
                      <Label>{enterpriseFieldsMapping[field]}</Label>
                      <div className="flex items-center">
                        <FormattedNumberInput
                          id={field}
                          disabled={isDisabled}
                          withoutDefaultValue={true}
                          value={
                            (substance[
                              field as keyof EnterpriseSubstanceDetails
                            ] as string) ?? ''
                          }
                          onChange={(event) =>
                            handleChangeNumericValues(event, field, index)
                          }
                          {...getFieldDefaultProps(isDisabled)}
                        />
                        <FieldErrorIndicator
                          {...{ field }}
                          errors={odsOdpErrors[index]}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label>{enterpriseFieldsMapping[field]}</Label>
                      <div className="flex items-center">
                        <SimpleInput
                          id={field}
                          disabled={isDisabled}
                          value={
                            (substance[
                              field as keyof EnterpriseSubstanceDetails
                            ] as string) ?? ''
                          }
                          onFocus={onTextareaFocus}
                          onChange={(event) =>
                            handleChangeTextValues(event, field, index)
                          }
                          type="text"
                          {...getFieldDefaultProps(isDisabled)}
                        />
                        <FieldErrorIndicator
                          {...{ field }}
                          errors={odsOdpErrors[index]}
                        />
                      </div>
                    </div>
                  ),
                )}
              </>
              {!isDisabled && (
                <IoTrash
                  className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
                  size={16}
                  onClick={() => {
                    onRemoveSubstance(index)
                  }}
                />
              )}
            </div>
            {index !== substanceData.length - 1 && <Divider />}
          </>
        ))}
      </div>
      <SubmitButton
        title="Add substance"
        isDisabled={isDisabled}
        onSubmit={onAddSubstance}
        className={cx('h-8', { 'mt-6': substanceData.length > 0 })}
      />
    </>
  )
}

export default PEnterpriseSubstanceDetailsSection
