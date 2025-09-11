import SimpleInput from '@ors/components/manage/Blocks/Section/ReportInfo/SimpleInput'
import { Label } from '@ors/components/manage/Blocks/BusinessPlans/BPUpload/helpers'
import { getFieldDefaultProps, handleChangeNumericValues } from '../utils'
import { tableColumns } from '../../constants'
import {
  ProjectEnterpriseDataProps,
  EnterpriseFundingDetails,
} from '../../interfaces'

import { keys, map } from 'lodash'

const PEnterprisesFundingDetailsSection = ({
  enterpriseData,
  setEnterpriseData,
  hasSubmitted,
  errors = {},
}: ProjectEnterpriseDataProps) => {
  const sectionId = 'funding_details'
  const sectionData: EnterpriseFundingDetails = enterpriseData[sectionId]

  return (
    <div className="flex flex-wrap gap-x-20 gap-y-3">
      {map(keys(sectionData), (field) => (
        <div>
          <Label>{tableColumns[field]} (US $)</Label>
          <SimpleInput
            id={field}
            value={sectionData[field as keyof EnterpriseFundingDetails] ?? ''}
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
  )
}

export default PEnterprisesFundingDetailsSection
