import { PCRSectionsProps } from '../interfaces'
import { FieldErrorIndicator } from '../../ProjectsListing/HelperComponents'

import { pcrFieldsMapping } from '../constants'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import {
  defaultProps,
  defaultPropsSimpleField,
  disabledClassName,
} from '../../ProjectsListing/constants'
import cx from 'classnames'
import Field from '@ors/components/manage/Form/Field'
import dayjs from 'dayjs'
import {
  DateInput,
  FormattedNumberInput,
} from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { formatFieldLabel } from '../../ProjectsListing/utils'

const PCRSummaryAndDelaysPrefilledData = ({
  PCRData,
  setPCRData,
  errors,
  crtAgencyEntry = [],
  crtAgencyData = {},
}: PCRSectionsProps & { errors: { [key: string]: string[] } }) => {
  const getFieldDefaultProps = () => ({
    ...defaultPropsSimpleField,
    className: cx(
      '!ml-0 h-10',
      defaultPropsSimpleField.className,
      disabledClassName,
    ),
  })

  const getSectionDefaultProps = () => ({
    ...defaultProps,
    FieldProps: { className: cx(defaultProps.FieldProps.className, 'w-full') },
  })

  const defaultPropsDateInput = {
    className: 'BPListUpload !ml-0 h-10 w-40 !flex-grow-0',
  }

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-wrap gap-x-20 gap-y-3">
          <div>
            <Label>{pcrFieldsMapping.project_code}</Label>
            <div className="flex items-center">
              <SimpleInput
                id="project_code"
                value={crtAgencyData.project_code}
                disabled={true}
                type="text"
                {...getFieldDefaultProps()}
              />
              <FieldErrorIndicator errors={errors} field="project_code" />
            </div>
          </div>
          <div className="flex-shrink basis-[25rem]">
            <Label>{pcrFieldsMapping.project_type}</Label>
            <div className="flex items-center">
              <div className="w-full">
                <Field
                  widget="autocomplete"
                  options={[]}
                  value={crtAgencyData.project_type}
                  disabled={true}
                  {...getSectionDefaultProps()}
                />
              </div>
              <FieldErrorIndicator errors={errors} field="project_type" />
            </div>
          </div>
          <div className="flex-shrink basis-[25rem]">
            <Label>{pcrFieldsMapping.sector}</Label>
            <div className="flex items-center">
              <div className="w-full">
                <Field
                  widget="autocomplete"
                  options={[]}
                  value={crtAgencyData.sector}
                  disabled={true}
                  {...getSectionDefaultProps()}
                />
              </div>
              <FieldErrorIndicator errors={errors} field="sector" />
            </div>
          </div>
          <div className="flex-shrink basis-[25rem]">
            <Label>{pcrFieldsMapping.agency}</Label>
            <div className="flex items-center">
              <div className="w-full">
                <Field
                  widget="autocomplete"
                  options={[]}
                  value={crtAgencyEntry}
                  disabled={true}
                  {...getSectionDefaultProps()}
                />
              </div>
              <FieldErrorIndicator errors={errors} field="agency" />
            </div>
          </div>
          <div className="flex-shrink basis-[25rem]">
            <Label>{pcrFieldsMapping.tranche}</Label>
            <div className="flex items-center">
              <div className="w-full">
                <Field
                  widget="autocomplete"
                  options={[]}
                  value={crtAgencyData.tranche?.toString()}
                  disabled={true}
                  {...getSectionDefaultProps()}
                />
              </div>
              <FieldErrorIndicator errors={errors} field="tranche" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-y-2">
        <div className="flex flex-wrap gap-x-20 gap-y-3">
          <div>
            <Label>{pcrFieldsMapping.date_approved}</Label>
            <div className="flex items-center">
              <DateInput
                id="date_approved"
                value={crtAgencyData.date_approved as string}
                formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
                disabled={true}
                className={cx(
                  defaultPropsDateInput.className,
                  disabledClassName,
                )}
              />
              <FieldErrorIndicator errors={errors} field="date_approved" />
            </div>
          </div>
          <div>
            <Label>{pcrFieldsMapping.date_completion_actual}</Label>
            <div className="flex items-center">
              <DateInput
                id="date_completion_actual"
                value={crtAgencyData.date_completion_actual as string}
                formatValue={(value) => dayjs(value).format('DD/MM/YYYY')}
                disabled={true}
                className={cx(
                  defaultPropsDateInput.className,
                  disabledClassName,
                )}
              />
              <FieldErrorIndicator
                errors={errors}
                field="date_completion_actual"
              />
            </div>
          </div>
          <div>
            <Label>{pcrFieldsMapping.funds_approved} (US $)</Label>
            <div className="flex items-center">
              <FormattedNumberInput
                id="funds_approved"
                value={crtAgencyData.funds_approved ?? ''}
                prefix="$"
                withoutDefaultValue={true}
                disabled={true}
                {...getFieldDefaultProps()}
              />
              <FieldErrorIndicator errors={errors} field="funds_approved" />
            </div>
          </div>
          <div className="flex flex-col gap-y-2">
            <div className="flex flex-wrap gap-x-20 gap-y-3">
              <div>
                <Label>{pcrFieldsMapping.odp_phase_out_approved}</Label>
                <div className="flex items-center">
                  <FormattedNumberInput
                    id="odp_phase_out_approved"
                    value={crtAgencyData.odp_phase_out_approved ?? ''}
                    withoutDefaultValue={true}
                    disabled={true}
                    {...getFieldDefaultProps()}
                  />
                  <FieldErrorIndicator
                    errors={errors}
                    field="odp_phase_out_approved"
                  />
                </div>
              </div>
              <div>
                <Label>{pcrFieldsMapping.odp_phase_out_actual}</Label>
                <div className="flex items-center">
                  <FormattedNumberInput
                    id="odp_phase_out_actual"
                    value={crtAgencyData.odp_phase_out_actual ?? ''}
                    withoutDefaultValue={true}
                    disabled={true}
                    {...getFieldDefaultProps()}
                  />
                  <FieldErrorIndicator
                    errors={errors}
                    field="odp_phase_out_actual"
                  />
                </div>
              </div>
              <div>
                <Label>
                  {formatFieldLabel(pcrFieldsMapping.hfc_phased_down_approved)}
                </Label>
                <div className="flex items-center">
                  <FormattedNumberInput
                    id="hfc_phased_down_approved"
                    value={crtAgencyData.hfc_phased_down_approved ?? ''}
                    withoutDefaultValue={true}
                    disabled={true}
                    {...getFieldDefaultProps()}
                  />
                  <FieldErrorIndicator
                    errors={errors}
                    field="hfc_phased_down_approved"
                  />
                </div>
              </div>
              <div>
                <Label>
                  {formatFieldLabel(pcrFieldsMapping.hfc_phased_down_actual)}
                </Label>
                <div className="flex items-center">
                  <FormattedNumberInput
                    id="hfc_phased_down_actual"
                    value={crtAgencyData.hfc_phased_down_actual ?? ''}
                    withoutDefaultValue={true}
                    disabled={true}
                    {...getFieldDefaultProps()}
                  />

                  <FieldErrorIndicator
                    errors={errors}
                    field="hfc_phased_down_actual"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PCRSummaryAndDelaysPrefilledData
