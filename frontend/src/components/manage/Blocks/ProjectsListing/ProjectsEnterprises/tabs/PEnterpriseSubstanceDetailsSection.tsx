import { ChangeEvent, useContext } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import ProjectsDataContext from '@ors/contexts/Projects/ProjectsDataContext'
import PermissionsContext from '@ors/contexts/PermissionsContext'
import { getIsInputDisabled } from '../../ProjectsCreate/SpecificFieldsHelpers'
import { FormattedNumberInput } from '../../../Replenishment/Inputs'
import { SubmitButton } from '../../HelperComponents'
import {
  EnterpriseSubstanceDetails,
  PEnterpriseDataProps,
  OptionsType,
} from '../../interfaces'
import {
  defaultProps,
  defaultPropsSimpleField,
  disabledClassName,
  initialSubstanceDetailsFields,
  tableColumns,
} from '../../constants'

import { find, get, isObject, map, sortBy, split } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import { Divider } from '@mui/material'
import cx from 'classnames'

const PEnterpriseSubstanceDetailsSection = ({
  enterpriseData,
  setEnterpriseData,
  hasSubmitted,
  odsOdpErrors,
}: PEnterpriseDataProps & {
  odsOdpErrors: { [key: string]: string[] }[]
}) => {
  const { substances, blends } = useContext(ProjectsDataContext)
  const { canEditProjectEnterprise } = useContext(PermissionsContext)
  const isDisabled = !canEditProjectEnterprise

  const sectionId = 'substance_details'
  const sectionData = enterpriseData[sectionId] || []

  const fields = ['phase_out_mt', 'ods_replacement', 'ods_replacement_phase_in']

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
    })
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
    })
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
      })
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
    })
  }

  const onRemoveSubstance = (index: number) => {
    setEnterpriseData((prevData) => {
      const sectionData = prevData[sectionId] || []

      return {
        ...prevData,
        [sectionId]: sectionData.filter((_, idx) => idx !== index),
      }
    })
  }

  const getErrors = (field: string, index: number) =>
    getIsInputDisabled(hasSubmitted, odsOdpErrors, false, field, index)

  const getFieldDefaultProps = (
    field: string,
    index: number,
    isFieldDisabled: boolean,
  ) => {
    return {
      ...{
        ...defaultPropsSimpleField,
        className: cx(defaultPropsSimpleField.className, '!m-0 h-10 !py-1', {
          'border-red-500': getErrors(field, index),
          [disabledClassName]: isFieldDisabled,
        }),
      },
    }
  }

  const getSubstanceValue = (substance: EnterpriseSubstanceDetails) =>
    substance.ods_substance
      ? `substance_${substance.ods_substance}`
      : substance.ods_blend
        ? `blend_${substance.ods_blend}`
        : null

  return (
    <>
      <div className="flex flex-col flex-wrap gap-x-20 gap-y-10">
        {sectionData.map((substance, index) => (
          <>
            <div className="align-center flex flex-row flex-wrap gap-x-7 gap-y-4">
              <>
                <div>
                  <Label>{tableColumns.ods_substance}</Label>
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
                    Input={{
                      error:
                        getErrors('ods_substance', index) ||
                        getErrors('ods_blend', index),
                    }}
                    {...defaultProps}
                    FieldProps={{
                      className:
                        defaultProps.FieldProps.className + ' w-full min-w-64',
                    }}
                  />
                </div>
                {map(fields, (field) => (
                  <div>
                    <Label>{tableColumns[field]}</Label>
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
                        field === 'ods_replacement'
                          ? handleChangeTextValues(event, field, index)
                          : handleChangeNumericValues(event, field, index)
                      }
                      {...getFieldDefaultProps(field, index, isDisabled)}
                    />
                  </div>
                ))}
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
            {index !== sectionData.length - 1 && <Divider />}
          </>
        ))}
      </div>
      <SubmitButton
        title="Add substance"
        isDisabled={isDisabled}
        onSubmit={onAddSubstance}
        className={cx('h-8', { 'mt-6': sectionData.length > 0 })}
      />
    </>
  )
}

export default PEnterpriseSubstanceDetailsSection
