import { useContext } from 'react'

import Field from '@ors/components/manage/Form/Field'
import { FieldErrorIndicator } from '@ors/components/manage/Blocks/ProjectsListing/HelperComponents'
import { disabledClassName } from '@ors/components/manage/Blocks/ProjectsListing/constants'
import { FormattedNumberInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { formatFieldLabel } from '@ors/components/manage/Blocks/ProjectsListing/utils'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import PCRDataContext from '@ors/contexts/PCR/PCRDataContext'
import { ImpactIndicatorSourceTag } from '../PCRView/PCRViewTabs/ViewHelperComponents'
import { PCRImpactIndicatorType } from '../interfaces'
import { getNumberPasteHandler } from '../utils'

import { find, isNil, map } from 'lodash'
import cx from 'classnames'

const booleanOptions = [
  { id: true, name: 'Yes' },
  { id: false, name: 'No' },
]

const isValidNumber = (value: string, dataType: string) =>
  dataType === 'number' ? /^\d*$/.test(value) : !isNaN(Number(value))

const PCRImpactIndicatorInput = ({
  indicator,
}: {
  indicator: PCRImpactIndicatorType
}) => {
  const { setPCRData, errors } = useContext(PCRDataContext)

  const { field, label, data_type, value, editable } = indicator

  const onChange = (value: PCRImpactIndicatorType['value']) => {
    setPCRData(
      (prevData) => ({
        ...prevData,
        impact_indicators: map(prevData.impact_indicators, (indicator) =>
          indicator.field === field ? { ...indicator, value } : indicator,
        ),
      }),
      field,
    )
  }

  const setNumber = (value: string) => {
    if (isValidNumber(value, data_type)) {
      onChange(value)
    }
  }

  return (
    <div className="flex flex-col justify-between">
      <Label>{formatFieldLabel(label)}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center">
          {data_type === 'boolean' ? (
            <Field
              id={field}
              widget="autocomplete"
              options={booleanOptions}
              value={find(booleanOptions, { id: value as boolean }) ?? null}
              onChange={(_, option: any) => onChange(option?.id ?? null)}
              getOptionLabel={(option: any) => option?.name ?? ''}
              isOptionEqualToValue={(option: any, selected: any) =>
                option.id === selected.id
              }
              FieldProps={{ className: 'BPListUpload mb-0 w-48' }}
            />
          ) : (
            <FormattedNumberInput
              id={field}
              className={cx('!m-0 w-48', { [disabledClassName]: !editable })}
              value={isNil(value) ? '' : String(value)}
              decimalDigits={data_type === 'decimal' ? 2 : 0}
              withoutDefaultValue={true}
              disabled={!editable}
              onChange={(event) => setNumber(event.target.value)}
              onPaste={getNumberPasteHandler(setNumber)}
            />
          )}
          <div className="w-7 shrink-0">
            <FieldErrorIndicator errors={errors.overview} field={field} />
          </div>
        </div>
        <ImpactIndicatorSourceTag indicator={indicator} />
      </div>
    </div>
  )
}

export default PCRImpactIndicatorInput
