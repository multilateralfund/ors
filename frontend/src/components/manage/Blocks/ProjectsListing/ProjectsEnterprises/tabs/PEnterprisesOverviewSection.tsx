import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { EnterpriseDataProps, EnterpriseOverview } from '../../interfaces'
import { defaultPropsSimpleField, tableColumns } from '../../constants'
import {
  getFieldDefaultProps,
  handleChangeNumericValues,
  handleChangeTextValues,
} from '../utils'

import { map } from 'lodash'

const PEnterprisesOverviewSection = ({
  enterpriseData,
  setEnterpriseData,
  hasSubmitted,
  errors = {},
}: EnterpriseDataProps) => {
  const sectionId = 'overview'
  const sectionData: EnterpriseOverview = enterpriseData[sectionId]

  const textFields = ['enterprise', 'location', 'application']
  const numericFields = ['local_ownership', 'export_to_non_a5']

  return (
    <>
      {map(textFields, (field) => (
        <div>
          <Label>{tableColumns[field]}</Label>
          <SimpleInput
            id={field}
            value={sectionData[field as keyof EnterpriseOverview]}
            onChange={(event) =>
              handleChangeTextValues(sectionId, field, setEnterpriseData, event)
            }
            type="text"
            {...getFieldDefaultProps(hasSubmitted, errors[field])}
            containerClassName={
              defaultPropsSimpleField.containerClassName + ' !w-[35rem]'
            }
          />
        </div>
      ))}
      <div className="mt-6 flex flex-wrap gap-x-20 gap-y-3">
        {map(numericFields, (field) => (
          <div>
            <Label>{tableColumns[field]} (%)</Label>
            <SimpleInput
              id={field}
              value={sectionData[field as keyof EnterpriseOverview] ?? ''}
              onChange={(event) =>
                handleChangeNumericValues(
                  sectionId,
                  field,
                  setEnterpriseData,
                  event,
                )
              }
              type="text"
              {...getFieldDefaultProps(hasSubmitted, errors[field])}
            />
          </div>
        ))}
      </div>
    </>
  )
}

export default PEnterprisesOverviewSection
