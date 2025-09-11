import { ChangeEvent } from 'react'

import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import Field from '@ors/components/manage/Form/Field'
import { getIsInputDisabled } from '../../ProjectsCreate/SpecificFieldsHelpers'
import { SubmitButton } from '../../HelperComponents'
import { ProjectEnterpriseDataProps, OptionsType } from '../../interfaces'
import {
  defaultProps,
  defaultPropsSimpleField,
  initialSubstanceDetailsFields,
  tableColumns,
} from '../../constants'
import { useStore } from '@ors/store'

import { find, get, isObject, map, sortBy, split } from 'lodash'
import { IoTrash } from 'react-icons/io5'
import { Divider } from '@mui/material'
import cx from 'classnames'

const PEnterprisesSubstanceDetailsSection = ({
  enterpriseData,
  setEnterpriseData,
  hasSubmitted,
  odsOdpErrors,
}: ProjectEnterpriseDataProps & {
  odsOdpErrors: { [key: string]: [] }[]
}) => {
  const sectionId = 'substance_details'
  const sectionData = enterpriseData[sectionId] || []

  const { substances, blends } = useStore((state) => state.cp_reports)
  const substancesOptions = map(
    sortBy(substances.data, 'name'),
    (substance) => ({
      ...substance,
      id: 'substance_' + substance.id,
      is_substance: true,
    }),
  )
  const blendOptions = map(sortBy(blends.data, 'name'), (blend) => ({
    ...blend,
    id: 'blend_' + blend.id,
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

  const getFieldDefaultProps = (field: string, index: number) => {
    return {
      ...{
        ...defaultPropsSimpleField,
        className: cx(defaultPropsSimpleField.className, '!m-0 h-10 !py-1', {
          'border-red-500': getErrors(field, index),
        }),
      },
    }
  }
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
                    value={
                      substance.ods_substance
                        ? `substance_${substance.ods_substance}`
                        : substance.ods_blend
                          ? `blend_${substance.ods_blend}`
                          : null
                    }
                    onChange={(_, value) =>
                      handleChangeDropdownValues(value, index)
                    }
                    getOptionLabel={(option) =>
                      (isObject(option)
                        ? get(option, 'name')
                        : (find(options, { id: option }) as OptionsType)?.[
                            'name'
                          ]) || ''
                    }
                    Input={{
                      error:
                        getErrors('ods_substance', index) ||
                        getErrors('ods_blend', index),
                    }}
                    {...defaultProps}
                  />
                </div>
                <div>
                  <Label>{tableColumns.phase_out_mt}</Label>
                  <SimpleInput
                    id="phase_out_mt"
                    value={substance.phase_out_mt ?? ''}
                    onChange={(event) =>
                      handleChangeNumericValues(event, 'phase_out_mt', index)
                    }
                    type="text"
                    {...getFieldDefaultProps('phase_out_mt', index)}
                  />
                </div>
                <div>
                  <Label>{tableColumns.ods_replacement}</Label>
                  <SimpleInput
                    id="ods_replacement"
                    value={substance.ods_replacement}
                    onChange={(event) =>
                      handleChangeTextValues(event, 'ods_replacement', index)
                    }
                    type="text"
                    {...getFieldDefaultProps('ods_replacement', index)}
                  />
                </div>
                <div>
                  <Label>{tableColumns.ods_replacement_phase_in}</Label>
                  <SimpleInput
                    id="ods_replacement_phase_in"
                    value={substance.ods_replacement_phase_in ?? ''}
                    onChange={(event) =>
                      handleChangeNumericValues(
                        event,
                        'ods_replacement_phase_in',
                        index,
                      )
                    }
                    type="text"
                    {...getFieldDefaultProps('ods_replacement_phase_in', index)}
                  />
                </div>
              </>
              <IoTrash
                className="mt-12 min-h-[16px] min-w-[16px] cursor-pointer fill-gray-400"
                size={16}
                onClick={() => {
                  onRemoveSubstance(index)
                }}
              />
            </div>
            {index !== sectionData.length - 1 && <Divider />}
          </>
        ))}
      </div>
      <SubmitButton
        title="Add substance"
        onSubmit={onAddSubstance}
        className={cx('h-8', { 'mt-6': sectionData.length > 0 })}
      />
    </>
  )
}

export default PEnterprisesSubstanceDetailsSection
