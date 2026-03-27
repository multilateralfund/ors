import { FormattedNumberInput } from '@ors/components/manage/Blocks/Replenishment/Inputs'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { FieldErrorIndicator } from '../HelperComponents'
import { canEditField, canViewField, handleChangeNumericValues } from '../utils'
import { ProjectDataProps, ProjectTypeApi } from '../interfaces'
import {
  tableColumns,
  defaultPropsSimpleField,
  disabledClassName,
} from '../constants'
import { useStore } from '@ors/store'

import { Checkbox } from '@mui/material'
import { omit } from 'lodash'
import cx from 'classnames'

const ProjectFundFields = ({
  projectData,
  setProjectData,
  project,
  errors = {},
  mode,
  postExComUpdate,
  type,
}: ProjectDataProps & {
  project?: ProjectTypeApi
  mode?: string
  postExComUpdate?: boolean
  type: string
}) => {
  const sectionIdentifier = 'crossCuttingFields'
  const crossCuttingFields = projectData[sectionIdentifier]
  const { total_fund, support_cost_psc, adjustment, interest } =
    crossCuttingFields

  const isRecommended = project?.submission_status === 'Recommended'
  const shouldDisplayPostExcomFields =
    mode === 'edit' &&
    project?.submission_status === 'Approved' &&
    type === 'crossCutting'

  const { viewableFields, editableFields } = useStore(
    (state) => state.projectFields,
  )

  const handleChangeBooleanValue = (value: boolean, field: string) => {
    setProjectData(
      (prevData) => ({
        ...prevData,
        [sectionIdentifier]: {
          ...prevData[sectionIdentifier],
          [field]: value,
        },
      }),
      field,
    )
  }

  const getFieldDefaultProps = (field: string) => ({
    ...{
      ...omit(defaultPropsSimpleField, 'containerClassName'),
      className: cx(defaultPropsSimpleField.className, '!m-0 h-10 !py-1', {
        [disabledClassName]:
          !canEditField(editableFields, field) ||
          (type === 'crossCutting'
            ? ['fund_transferred', 'psc_transferred'].includes(field)
            : ['total_fund', 'support_cost_psc'].includes(field) &&
              !isRecommended) ||
          (['adjustment', 'interest'].includes(field) && !postExComUpdate),
      }),
    },
  })

  return (
    <>
      {canViewField(viewableFields, 'total_fund') && (
        <div>
          <Label>{tableColumns.total_fund} (US $)</Label>
          <div className="flex items-center">
            <FormattedNumberInput
              id="total_fund"
              value={total_fund ?? ''}
              prefix="$"
              withoutDefaultValue={true}
              onChange={(event) =>
                handleChangeNumericValues(
                  event,
                  'total_fund',
                  sectionIdentifier,
                  setProjectData,
                )
              }
              disabled={
                !canEditField(editableFields, 'total_fund') ||
                (type === 'approval' && !isRecommended)
              }
              {...getFieldDefaultProps('total_fund')}
            />
            <div className="w-8">
              <FieldErrorIndicator errors={errors} field="total_fund" />
            </div>
          </div>
        </div>
      )}
      {canViewField(viewableFields, 'adjustment') &&
        shouldDisplayPostExcomFields && (
          <div>
            <Label>{tableColumns.adjustment}</Label>
            <div className="flex">
              <Checkbox
                className="w-40 justify-start pb-2 pl-0 pt-1"
                checked={Boolean(adjustment)}
                disabled={
                  !canEditField(editableFields, 'adjustment') ||
                  !postExComUpdate
                }
                onChange={(_: React.SyntheticEvent, value) =>
                  handleChangeBooleanValue(value, 'adjustment')
                }
                inputProps={{ tabIndex: 0 }}
                sx={{
                  '&.Mui-focusVisible': {
                    backgroundColor: 'rgba(0, 0, 0, 0.03)',
                  },
                  color: 'black',
                }}
              />
              <div className="w-8">
                <FieldErrorIndicator errors={errors} field="adjustment" />
              </div>
            </div>
          </div>
        )}
      {canViewField(viewableFields, 'support_cost_psc') && (
        <div>
          <Label>{tableColumns.support_cost_psc} (US $)</Label>
          <div className="flex items-center">
            <FormattedNumberInput
              id="support_cost_psc"
              value={support_cost_psc ?? ''}
              prefix="$"
              withoutDefaultValue={true}
              onChange={(event) =>
                handleChangeNumericValues(
                  event,
                  'support_cost_psc',
                  sectionIdentifier,
                  setProjectData,
                )
              }
              disabled={
                !canEditField(editableFields, 'support_cost_psc') ||
                (type === 'approval' && !isRecommended)
              }
              {...getFieldDefaultProps('support_cost_psc')}
            />
            <div className="w-8">
              <FieldErrorIndicator errors={errors} field="support_cost_psc" />
            </div>
          </div>
        </div>
      )}
      {canViewField(viewableFields, 'interest') &&
        shouldDisplayPostExcomFields && (
          <div>
            <Label>{tableColumns.interest}</Label>
            <div className="flex items-center">
              <FormattedNumberInput
                id="interest"
                value={interest ?? ''}
                prefix="$"
                withoutDefaultValue={true}
                onChange={(event) =>
                  handleChangeNumericValues(
                    event,
                    'interest',
                    sectionIdentifier,
                    setProjectData,
                  )
                }
                disabled={
                  !canEditField(editableFields, 'interest') || !postExComUpdate
                }
                {...getFieldDefaultProps('interest')}
              />
              <FieldErrorIndicator errors={errors} field="interest" />
            </div>
          </div>
        )}
    </>
  )
}

export default ProjectFundFields
