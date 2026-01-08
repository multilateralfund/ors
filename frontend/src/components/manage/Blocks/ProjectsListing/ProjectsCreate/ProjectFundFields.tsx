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

import cx from 'classnames'

const ProjectFundFields = ({
  projectData,
  setProjectData,
  project,
  errors = {},
  type,
}: ProjectDataProps & {
  project?: ProjectTypeApi
  type: string
}) => {
  const sectionIdentifier = 'crossCuttingFields'
  const crossCuttingFields = projectData[sectionIdentifier]
  const { total_fund, support_cost_psc } = crossCuttingFields

  const isRecommended = project?.submission_status === 'Recommended'

  const { viewableFields, editableFields } = useStore(
    (state) => state.projectFields,
  )

  const getFieldDefaultProps = (field: string) => ({
    ...{
      ...defaultPropsSimpleField,
      className: cx(defaultPropsSimpleField.className, '!m-0 h-10 !py-1', {
        [disabledClassName]:
          !canEditField(editableFields, field) ||
          (type === 'crossCutting'
            ? ['fund_transferred', 'psc_transferred'].includes(field)
            : ['total_fund', 'support_cost_psc'].includes(field) &&
              !isRecommended),
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
            <FieldErrorIndicator errors={errors} field="support_cost_psc" />
          </div>
        </div>
      )}
    </>
  )
}

export default ProjectFundFields
