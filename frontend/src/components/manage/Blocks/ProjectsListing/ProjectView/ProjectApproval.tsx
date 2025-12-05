import { useCallback } from 'react'

import {
  detailItem,
  numberDetailItem,
  viewModesHandler,
} from './ViewHelperComponents'
import { tableColumns, viewColumnsClassName } from '../constants'
import { ProjectViewProps } from '../interfaces'
import { canViewField } from '../utils'
import { useStore } from '@ors/store'

import { filter, get } from 'lodash'
import cx from 'classnames'

const ProjectApproval = ({
  project,
  specificFields,
  fieldHistory,
}: { fieldHistory: any } & ProjectViewProps) => {
  const { viewableFields } = useStore((state) => state.projectFields)

  const isTransferred = !!project.transferred_from

  const odsFields = filter(specificFields, (field) => field.table === 'ods_odp')

  const getFieldHistory = useCallback(
    (name: string) => {
      return fieldHistory?.[name] ?? []
    },
    [fieldHistory],
  )

  return (
    <div className="flex w-full flex-col gap-4">
      <div className={viewColumnsClassName}>
        {filter(specificFields, (field) => field.table === 'project').map(
          (field) => {
            const upatedLabels = {
              meeting: isTransferred
                ? tableColumns.transfer_meeting
                : tableColumns.meeting,
              decision: isTransferred
                ? tableColumns.transfer_decision
                : tableColumns.decision,
            }

            const updatedField =
              field.write_field_name in upatedLabels
                ? { ...field, label: upatedLabels[field.write_field_name] }
                : field

            return (
              <>
                {canViewField(viewableFields, field.write_field_name) && (
                  <span
                    key={field.write_field_name}
                    className={cx({
                      '!basis-full': [
                        'programme_officer',
                        'excom_provision',
                      ].includes(field.write_field_name),
                    })}
                  >
                    {viewModesHandler[field.data_type](
                      project,
                      updatedField,
                      field.write_field_name === 'excom_provision'
                        ? {
                            containerClassName: '!basis-full w-full',
                            className: 'whitespace-nowrap',
                            fieldClassName: 'max-w-[50%]',
                          }
                        : undefined,
                      getFieldHistory(field.write_field_name),
                    )}
                  </span>
                )}
                {project.status === 'Transferred' &&
                  (field.write_field_name === 'meeting' ? (
                    detailItem(
                      tableColumns.transfer_meeting,
                      project.transfer_meeting,
                    )
                  ) : field.write_field_name === 'excom_provision' ? (
                    <span
                      key="transfer_excom_provision"
                      className="!basis-full"
                    >
                      {detailItem(
                        tableColumns.transfer_excom_provision,
                        project.transfer_excom_provision,
                      )}
                    </span>
                  ) : null)}
              </>
            )
          },
        )}
      </div>
      {odsFields.length > 0 && (
        <div className={viewColumnsClassName}>
          {odsFields.map(
            (field) =>
              canViewField(viewableFields, field.write_field_name) && (
                <span key={field.write_field_name}>
                  {numberDetailItem(
                    field.label,
                    get(project, field.read_field_name) ??
                      get(project, `computed_${field.read_field_name}`),
                    field.data_type,
                  )}
                </span>
              ),
          )}
        </div>
      )}
      <div className={viewColumnsClassName}>
        {canViewField(viewableFields, 'total_fund') &&
          numberDetailItem(
            tableColumns.total_fund + ' (US $)',
            project.total_fund as string,
            'decimal',
          )}
        {canViewField(viewableFields, 'support_cost_psc') &&
          numberDetailItem(
            tableColumns.support_cost_psc + ' (US $)',
            project.support_cost_psc as string,
            'decimal',
          )}
      </div>
      {project.status === 'Transferred' && (
        <div className={viewColumnsClassName}>
          {numberDetailItem(
            tableColumns.fund_transferred,
            project.fund_transferred.toString(),
            'decimal',
          )}
          {numberDetailItem(
            tableColumns.psc_transferred,
            project.psc_transferred.toString(),
            'decimal',
          )}
        </div>
      )}
    </div>
  )
}

export default ProjectApproval
